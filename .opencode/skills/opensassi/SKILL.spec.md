# SKILL.spec.md — opensassi

## 1. Overview

**Role**: Bootstrap a new project environment — detect OS, install toolchain (git, Node.js via nvm/LTS), clone FlameGraph, set up project infrastructure.

**Persona**: Senior DevOps engineer specializing in cross-platform development environment provisioning.

**Activation Behavior**: Run `init check` to report current environment status. Show available commands.

**Commands**:

| Command | Description |
|---------|-------------|
| `init` | Execute companion scripts: env-check, init install, init flamegraph, install-npm-deps, ensure-gitignore |
| `init install` | Install development environment toolchain: detect OS, check for installer, run or report gap |
| `init flamegraph` | Clone Brendan Gregg's FlameGraph at tagged v1.0 to `scripts/FlameGraph/` |
| `init check` | Run env-check and verify Node.js, git, FlameGraph, npm deps, gitignore |

## 2. Component Specifications

### `EnvironmentBootstrapper`

```
CLASS EnvironmentBootstrapper
  METHODS:
    init() -> void
      runEnvCheck() -> EnvReport
      runInitInstall() -> void
      runInitFlamegraph() -> void
      runInstallNpmDeps() -> void
      runEnsureGitignore() -> void
    initInstall() -> void
      detectEnvironment() -> EnvReport
      findInstaller() -> str or null
      runInstaller(path: str) -> void
      reportGap(env: EnvReport) -> void
    initFlamegraph() -> void
      cloneOrUpdateFlamegraph() -> void
    initCheck() -> EnvReport
      verifyNodeVersion() -> bool
      verifyGit() -> bool
      verifyFlamegraph() -> bool
      verifyNpmDeps() -> bool
      verifyGitignore() -> bool
```

### `EnvReport`

```
JSON STRUCTURE:
  os, distro, version, codename, pkg_manager,
  shell, is_wsl, arch, node_version, nvm_version, git_version
```

## 3. System Architecture

```mermaid
graph TB
    subgraph opensassi
        A[init]
        B[init install]
        C[init flamegraph]
        D[init check]
    end

    subgraph BootstrapScripts
        E[env-check.sh]
        F[install-npm-deps.sh]
        G[ensure-gitignore.sh]
        H[scripts/install/ installer scripts]
    end

    subgraph Toolchain
        I[git]
        J[Node.js LTS via nvm]
        K[FlameGraph scripts]
        L[npm dependencies]
    end

    A --> E --> I
    A --> J
    A --> C --> K
    A --> F --> L
    A --> G
    B --> H --> I
    B --> J
    D --> E
    D --> K
    D --> L
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant OS as opensassi skill
    participant SH as shell scripts
    participant FS as FileSystem

    User->>OS: init check
    OS->>SH: run env-check.sh
    SH->>OS: JSON env report
    OS->>OS: verify Node.js git FlameGraph npm
    OS->>User: environment status

    User->>OS: init
    OS->>SH: env-check.sh bootstrap git + Node.js
    OS->>SH: init install
    alt installer found
        OS->>SH: run installer
        SH->>OS: toolchain installed
    else installer not found
        OS->>User: report gap continue
    end
    OS->>SH: init flamegraph
    SH->>FS: clone FlameGraph v1.0
    OS->>SH: install-npm-deps.sh
    OS->>SH: ensure-gitignore.sh
    OS->>User: environment ready
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>opensassi Bootstrap Flow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Environment Bootstrap Pipeline</div>
  <div id="flow" style="position:absolute;top:50px;left:20px;width:680px;height:360px;"></div>
  <div id="controls" style="position:absolute;bottom:10px;left:0;width:100%;text-align:center;">
    <button data-testid="play-pause" id="play-btn" style="margin:0 5px;padding:4px 16px;cursor:pointer;">Play</button>
    <button id="replay-btn" style="margin:0 5px;padding:4px 16px;cursor:pointer;">Replay</button>
    <span id="kf-counter" style="margin-left:10px;font-size:14px;">0/<span id="kf-total">7</span></span>
  </div>
</div>
<script>
(function() {
  var totalDuration = 14000;
  var keyframes = [
    { time: 0, label: "activate" },
    { time: 2000, label: "init-check" },
    { time: 4000, label: "env-check" },
    { time: 6000, label: "init-install" },
    { time: 8000, label: "init-flamegraph" },
    { time: 10000, label: "npm-deps" },
    { time: 12000, label: "gitignore" },
    { time: 14000, label: "ready" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "Init Check", x: 340, y: 65, color: "#2196f3" },
    { label: "Env Check", x: 340, y: 110, color: "#ff9800" },
    { label: "Init Install", x: 340, y: 155, color: "#9c27b0" },
    { label: "Init Flamegraph", x: 340, y: 200, color: "#f44336" },
    { label: "NPM Dependencies", x: 340, y: 245, color: "#00bcd4" },
    { label: "Ensure Gitignore", x: 340, y: 290, color: "#607d8b" },
    { label: "Ready", x: 340, y: 335, color: "#795548" }
  ];

  var svg = d3.select("#flow").append("svg")
    .attr("width", 680).attr("height", 360);

  var arrows = svg.append("g").attr("class", "arrows");
  var boxes = svg.append("g").attr("class", "boxes");
  var label = svg.append("text")
    .attr("x", 340).attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "12")
    .attr("fill", "#666");

  var rects = boxes.selectAll("rect")
    .data(steps).enter()
    .append("rect")
    .attr("x", function(d) { return d.x - 80; })
    .attr("y", function(d) { return d.y; })
    .attr("width", 160)
    .attr("height", 34)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", function(d) { return d.color; })
    .attr("opacity", 0.15)
    .attr("stroke", function(d) { return d.color; })
    .attr("stroke-width", 1.5);

  boxes.selectAll("text")
    .data(steps).enter()
    .append("text")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y + 22; })
    .attr("text-anchor", "middle")
    .attr("font-size", "11")
    .attr("fill", "#333")
    .text(function(d) { return d.label; });

  arrows.selectAll("line")
    .data(steps.slice(0, -1)).enter()
    .append("line")
    .attr("x1", function(d) { return d.x; })
    .attr("y1", function(d) { return d.y + 34; })
    .attr("x2", function(d) { return d.x; })
    .attr("y2", function(d, i) { return steps[i + 1].y; })
    .attr("stroke", "#999")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4,2")
    .attr("opacity", 0.3);

  var currentFrame = 0;
  var isPlaying = false;
  var timer = null;

  function updateFrame(idx) {
    currentFrame = Math.max(0, Math.min(idx, keyframes.length - 1));
    var kfLabel = keyframes[currentFrame].label;
    label.text(kfLabel.replace(/-/g, " "));
    rects.attr("opacity", function(d, i) { return i < currentFrame ? 0.85 : 0.15; });
    document.getElementById("kf-counter").textContent = currentFrame + "/";
  }

  window.jumpToKeyframe = function(idx) {
    if (isPlaying) togglePlay();
    updateFrame(idx);
  };

  window.resetAnimation = function() {
    if (isPlaying) togglePlay();
    updateFrame(0);
    rects.attr("opacity", 0.15);
    label.text("ready");
  };

  window.getAnimationState = function() {
    return {
      hor: currentFrame,
      ver: 0,
      precision: 1,
      logCount: currentFrame,
      keyframeIdx: currentFrame,
      keyframeLabel: keyframes[currentFrame] ? keyframes[currentFrame].label : ""
    };
  };

  function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById("play-btn").textContent = isPlaying ? "Pause" : "Play";
    if (isPlaying) {
      timer = setInterval(function() {
        currentFrame++;
        if (currentFrame >= keyframes.length) {
          currentFrame = keyframes.length - 1;
          togglePlay();
          return;
        }
        updateFrame(currentFrame);
      }, totalDuration / keyframes.length);
    } else {
      clearInterval(timer);
    }
  }

  document.getElementById("play-btn").addEventListener("click", togglePlay);
  document.getElementById("replay-btn").addEventListener("click", function() {
    window.resetAnimation();
    setTimeout(togglePlay, 300);
  });
})();
</script>
</body>
</html>
```

## 6. Testing Requirements

| Test ID | Description | Verification |
|---------|-------------|--------------|
| OSS-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/opensassi/SKILL.spec.md` passes |
| OSS-002 | Mermaid sequence diagram renders to PNG | Both mermaid diagrams render without errors |
| OSS-003 | D3 animation captures 8 keyframes | Filmstrip captures all 8 frames |
| OSS-004 | Animation globals present | `getAnimationState` returns expected shape |

## 7. Cross-References

- **Dependencies**: `bash` or `powershell`, `git` (installed if missing), companion scripts in `.opencode/skills/opensassi/scripts/`
- **Loaded by**: `AGENTS.md` (on demand via `skill opensassi`)
- **Used by**: `profiler` skill (clones FlameGraph scripts via opensassi)
- **Related**: `profiler` (FlameGraph dependency), `git` (bootstrap git)
