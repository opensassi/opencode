#!/usr/bin/env bash
# env-check.sh — Bootstrap environment detection for opencode init skill.
# Detects OS, ensures git, installs Node.js LTS via nvm if needed.
# Outputs JSON to stdout: {os, distro, version, codename, pkg_manager, shell,
#                          is_wsl, arch, node_version, nvm_version, git_version}
#
# Usage: bash env-check.sh
# Dependencies: bash, common UNIX utilities (uname, grep, cut, etc.)

set -euo pipefail

# --- OS Detection ---
OS="$(uname -s)"
ARCH="$(uname -m)"
SHELL_NAME="$(basename "${SHELL:-bash}")"
IS_WSL=false

if grep -qi "microsoft\|wsl" /proc/version 2>/dev/null; then
    IS_WSL=true
fi

# Normalize arch
case "$ARCH" in
    x86_64|amd64) ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
esac

# --- Distro Detection ---
DISTRO=""
VERSION=""
CODENAME=""
PKG_MANAGER=""

detect_linux() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO="${ID:-linux}"
        VERSION="${VERSION_ID:-}"
        CODENAME="${VERSION_CODENAME:-$UBUNTU_CODENAME}"
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        DISTRO="${DISTRIB_ID:-linux}"
        VERSION="${DISTRIB_RELEASE:-}"
        CODENAME="${DISTRIB_CODENAME:-}"
    fi
    DISTRO="$(echo "$DISTRO" | tr '[:upper:]' '[:lower:]')"

    # Detect package manager
    for pm in apt dnf yum pacman zypper; do
        if command -v "$pm" &>/dev/null; then
            PKG_MANAGER="$pm"
            break
        fi
    done
}

detect_macos() {
    DISTRO="macos"
    if command -v sw_vers &>/dev/null; then
        VERSION="$(sw_vers -productVersion 2>/dev/null || echo "")"
        case "$VERSION" in
            15.*) CODENAME="sequoia" ;;
            14.*) CODENAME="sonoma" ;;
            13.*) CODENAME="ventura" ;;
            12.*) CODENAME="monterey" ;;
            11.*) CODENAME="big-sur" ;;
            *)    CODENAME="unknown" ;;
        esac
    fi
    if command -v brew &>/dev/null; then
        PKG_MANAGER="brew"
    fi
}

case "$OS" in
    Linux)
        detect_linux
        if $IS_WSL; then
            # In WSL, use Windows-side detection for pkg_manager hint
            :
        fi
        ;;
    Darwin)
        detect_macos
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Git Bash / MSYS2 on Windows — limited support, point to ps1
        DISTRO="windows"
        OS="win32"
        PKG_MANAGER=""
        if command -v winget &>/dev/null; then
            PKG_MANAGER="winget"
        elif command -v choco &>/dev/null; then
            PKG_MANAGER="choco"
        fi
        ;;
    *)
        DISTRO="unknown"
        ;;
esac

# --- Ensure git ---
if ! command -v git &>/dev/null; then
    echo "[INFO] git not found. Installing..." >&2
    case "${PKG_MANAGER:-}" in
        apt)    sudo apt update && sudo apt install -y git ;;
        dnf)    sudo dnf install -y git ;;
        yum)    sudo yum install -y git ;;
        pacman) sudo pacman -Sy --noconfirm git ;;
        zypper) sudo zypper install -y git ;;
        brew)   brew install git ;;
        *)
            echo "[WARN] Cannot install git automatically. Install git manually." >&2
            ;;
    esac
fi
GIT_VERSION="$(git --version 2>/dev/null | sed 's/git version //' || echo "")"

# --- Ensure Node.js (LTS via nvm) ---
NODE_VERSION=""
NVM_VERSION=""

setup_node() {
    # Check if node is already at LTS or later
    if command -v node &>/dev/null; then
        local current
        current="$(node --version | sed 's/^v//')"
        local major
        major="$(echo "$current" | cut -d. -f1)"
        # Use node if >= 18 (LTS cutoff)
        if [ "$major" -ge 18 ] 2>/dev/null; then
            NODE_VERSION="$current"
            echo "[INFO] Node.js v$NODE_VERSION already available" >&2
            return 0
        fi
    fi

    # Find or install nvm
    local nvm_install_dir=""
    if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
        nvm_install_dir="$NVM_DIR"
    elif [ -s "$HOME/.nvm/nvm.sh" ]; then
        nvm_install_dir="$HOME/.nvm"
    elif [ -s "$HOME/.local/share/nvm/nvm.sh" ]; then
        nvm_install_dir="$HOME/.local/share/nvm"
    fi

    if [ -n "$nvm_install_dir" ]; then
        echo "[INFO] nvm found at $nvm_install_dir" >&2
        export NVM_DIR="$nvm_install_dir"
        # shellcheck disable=SC1091
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        NVM_VERSION="$(nvm --version 2>/dev/null || echo "")"
    else
        echo "[INFO] nvm not found. Installing nvm v0.40.0..." >&2
        export NVM_DIR="$HOME/.nvm"
        mkdir -p "$NVM_DIR"
        curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh" | bash 2>/dev/null || {
            echo "[ERROR] Failed to install nvm. Install manually:" >&2
            echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash" >&2
            return 1
        }
        # shellcheck disable=SC1091
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        NVM_VERSION="$(nvm --version 2>/dev/null || echo "")"
        echo "[INFO] nvm v$NVM_VERSION installed" >&2
    fi

    # Install LTS node (idempotent — no-op if already present)
    if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
        echo "[INFO] Installing latest Node.js LTS via nvm..." >&2
        nvm install --lts 2>/dev/null || true
        nvm use --lts 2>/dev/null || true
        # Write .nvmrc for project
        local project_root
        project_root="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
        echo "--lts" > "$project_root/.nvmrc" 2>/dev/null || true
        NODE_VERSION="$(node --version 2>/dev/null | sed 's/^v//' || echo "")"
        echo "[INFO] Node.js v$NODE_VERSION (LTS) ready via nvm" >&2
    fi
}

setup_node || true

# --- Output JSON ---
cat <<JSONEOF
{
  "os": "$OS",
  "distro": "$DISTRO",
  "version": "$VERSION",
  "codename": "$CODENAME",
  "pkg_manager": "$PKG_MANAGER",
  "shell": "$SHELL_NAME",
  "is_wsl": $IS_WSL,
  "arch": "$ARCH",
  "node_version": "$NODE_VERSION",
  "nvm_version": "$NVM_VERSION",
  "git_version": "$GIT_VERSION"
}
JSONEOF
