# env-check.ps1 — Bootstrap environment detection for opencode init skill (Windows native).
# Detects OS, ensures git, installs Node.js LTS via nvm-windows if needed.
# Outputs JSON to stdout: {os, distro, version, codename, pkg_manager, shell,
#                          is_wsl, arch, node_version, nvm_version, git_version}
#
# Usage: powershell -ExecutionPolicy Bypass -File env-check.ps1

$ErrorActionPreference = "Stop"

# --- OS Detection ---
$os = "win32"
$distro = "windows"
$version = ""
$codename = ""
$arch = [Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
if ($arch -match "AMD64|x86_64") { $arch = "x64" }
elseif ($arch -match "ARM64") { $arch = "arm64" }
$shell = "powershell"
$is_wsl = $false

# Detect package manager
$pkg_manager = ""
if (Get-Command winget -ErrorAction SilentlyContinue) { $pkg_manager = "winget" }
elseif (Get-Command choco -ErrorAction SilentlyContinue) { $pkg_manager = "choco" }
elseif (Get-Command scoop -ErrorAction SilentlyContinue) { $pkg_manager = "scoop" }

# --- Ensure git ---
$git_version = ""
try {
    $git_out = & git --version 2>$null
    if ($git_out) {
        $git_version = ($git_out -replace 'git version ', '').Trim()
    }
} catch {
    Write-Host "[INFO] git not found. Installing via winget..." -ForegroundColor Yellow
    if ($pkg_manager -eq "winget") {
        & winget install Git.Git --silent --accept-package-agreements 2>$null
        # Refresh PATH so git is available
        $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
        $git_out = & git --version 2>$null
        if ($git_out) { $git_version = ($git_out -replace 'git version ', '').Trim() }
    } else {
        Write-Host "[WARN] Cannot install git automatically. Install from https://git-scm.com/" -ForegroundColor Red
    }
}

# --- Ensure Node.js (LTS via nvm-windows) ---
$node_version = ""
$nvm_version = ""

function Setup-Node {
    # Check if node is already at LTS or later
    try {
        $current = & node --version 2>$null
        if ($current) {
            $current = $current -replace '^v', ''
            $major = ($current -split '\.')[0]
            if ($major -ge 18) {
                $script:node_version = $current
                Write-Host "[INFO] Node.js v$node_version already available" -ForegroundColor Green
                return
            }
        }
    } catch {
        # node not found, continue
    }

    # Check for nvm-windows
    $nvm_path = Get-Command nvm -ErrorAction SilentlyContinue
    if (-not $nvm_path) {
        Write-Host "[INFO] nvm-windows not found. Installing via winget..." -ForegroundColor Yellow
        try {
            if ($pkg_manager -eq "winget") {
                & winget install CoreyButler.NVMforWindows --silent --accept-package-agreements 2>$null
                # nvm-windows adds to PATH; need a new shell or reload
                $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
                # nvm-windows may need a refresh
                $env:NVM_HOME = "$env:USERPROFILE\AppData\Roaming\nvm"
                $env:NVM_SYMLINK = "$env:ProgramFiles\nodejs"
                $env:Path = "$env:NVM_HOME;$env:NVM_SYMLINK;$env:Path"
            } else {
                Write-Host "[WARN] Cannot install nvm-windows automatically. Install from:" -ForegroundColor Red
                Write-Host "  https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor Red
                return
            }
        } catch {
            Write-Host "[ERROR] Failed to install nvm-windows." -ForegroundColor Red
            return
        }
    }

    # Verify nvm is available
    try {
        $nvm_ver = & nvm version 2>$null
        if ($nvm_ver) {
            $script:nvm_version = $nvm_ver.Trim()
            Write-Host "[INFO] nvm-windows v$nvm_version found" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARN] nvm command not available after install. Restart terminal and retry." -ForegroundColor Red
        return
    }

    # Install LTS node
    Write-Host "[INFO] Installing latest Node.js LTS via nvm-windows..." -ForegroundColor Yellow
    try {
        & nvm install lts 2>$null
        & nvm use lts 2>$null
        # Write .nvmrc for the project
        $project_root = if (Test-Path ".git") { (Get-Location).Path } else { "." }
        "--lts" | Out-File -FilePath "$project_root\.nvmrc" -Encoding utf8 -Force
        $node_ver = & node --version 2>$null
        if ($node_ver) {
            $script:node_version = ($node_ver -replace '^v', '').Trim()
            Write-Host "[INFO] Node.js v$node_version (LTS) ready via nvm-windows" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Failed to install Node.js LTS." -ForegroundColor Red
    }
}

Setup-Node

# --- Output JSON ---
$json = @{
    os           = $os
    distro       = $distro
    version      = $version
    codename     = $codename
    pkg_manager  = $pkg_manager
    shell        = $shell
    is_wsl       = $is_wsl
    arch         = $arch
    node_version = $node_version
    nvm_version  = $nvm_version
    git_version  = $git_version
}

Write-Output ($json | ConvertTo-Json -Compress)
