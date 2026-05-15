# SKILL.spec.md — git

## 1. Overview

**Role**: Rebase-based git workflow — single atomic commits on main with integrated session evaluation.

**Persona**: Senior DevOps engineer specializing in Git rebase workflows and CI pipeline management.

**Activation Behavior**: Check `git status` and `git branch`. Suggest `start session` if not on main or dirty. Show available commands.

**Commands**:

| Command | Description |
|---------|-------------|
| `start session` | Begin new development session from clean baseline: `git checkout main`, `git pull --rebase`, verify clean |
| `finish session` | Complete session: stage all, generate eval, commit, rebase, test, fix loop, write sidecar, export archive, amend, push |
| `sync` | Fetch latest from origin and rebase current work: `git fetch origin`, `git rebase origin/main`, test |

## 2. Component Specifications

### `SessionWorkflow`

```
CLASS SessionWorkflow
  METHODS:
    startSession() -> void
      checkoutMain() -> void
      pullRebase() -> void
      verifyClean() -> bool
    finishSession() -> void
      stageAll() -> void
      generateEvaluationSlug() -> str
      getSessionId() -> str
      constructCommitMessage(slug: str, id: str) -> str
      createCommit(msg: str) -> void
      rebaseOntoMain() -> void
        handleConflicts() -> void
      runTests() -> TestResult
        fixAndAmend() -> void
      writeSidecar(content: str, path: str) -> void
      exportArchive(slug: str, id: str) -> void
      validateArtifacts() -> bool
      stageArtifacts() -> void
      amendCommit() -> void
      push() -> void
    sync() -> void
      fetchOrigin() -> void
      rebaseOntoMain() -> void
      runTests() -> TestResult
```

### `CommitMessage`

```
FORMAT: <title-slug>-<session-id-noprefix>
EXAMPLE: 2026-05-11-testing-plan-revision-1e793e9b0ffeLqAjZOHtI8vy8v
CONSTRAINTS: single line, no body, matches session evaluation sidecar filename
```

## 3. System Architecture

```mermaid
graph TB
    subgraph git-skill
        A[start session]
        B[finish session]
        C[sync]
    end

    subgraph SessionLifecycle
        D[checkout main]
        E[pull rebase origin/main]
        F[verify clean tree]
        G[stage all git add -A]
        H[generate evaluation slug]
        I[create commit]
        J[rebase onto origin/main]
        K[resolve conflicts]
        L[run tests]
        M[fix amend rebase loop]
        N[write sidecar md]
        O[export archive]
        P[amend commit with artifacts]
        Q[git push]
    end

    subgraph Dependencies
        R[session-evaluation skill]
        S[opencode session list]
    end

    A --> D --> E --> F
    B --> G --> H --> I --> J
    J --> K
    J --> L
    L --> M
    M --> J
    L --> N --> O --> P --> Q
    H --> R
    H --> S
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Git as git skill
    participant SE as session-evaluation
    participant Shell as git shell
    participant FS as FileSystem

    User->>Git: start session
    Git->>Shell: git checkout main
    Git->>Shell: git pull --rebase
    Git->>Shell: git status
    Git->>User: clean tree ready

    User->>Git: finish session
    Git->>Shell: git add -A
    Git->>SE: skill session-evaluation
    Git->>SE: generate
    SE->>Git: title slug + session ID
    Git->>Shell: git commit -m msg
    Git->>Shell: git fetch origin
    Git->>Shell: git rebase origin/main
    alt conflicts
        Git->>User: resolve conflicts
        Git->>Shell: git add resolved
        Git->>Shell: git rebase --continue
    end
    Git->>Shell: run tests
    alt tests fail
        Git->>Shell: fix, git add -A
        Git->>Shell: git commit --amend --no-edit
        Git->>Shell: git rebase origin/main
    end
    Git->>SE: export
    Git->>FS: write sidecar to sessions/
    Git->>Shell: git add sessions/
    Git->>Shell: git commit --amend --no-edit
    Git->>Shell: git push
    Git->>User: session complete
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>git skill Session Workflow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Git Session Workflow</div>
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
    { time: 0, label: "start-session" },
    { time: 2000, label: "develop" },
    { time: 4000, label: "stage-all" },
    { time: 6000, label: "commit" },
    { time: 8000, label: "rebase" },
    { time: 10000, label: "test" },
    { time: 12000, label: "export-eval" },
    { time: 14000, label: "push" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Start Session", x: 340, y: 20, color: "#4caf50" },
    { label: "Develop", x: 340, y: 65, color: "#2196f3" },
    { label: "Stage All", x: 340, y: 110, color: "#ff9800" },
    { label: "Create Commit", x: 340, y: 155, color: "#9c27b0" },
    { label: "Rebase onto Main", x: 340, y: 200, color: "#f44336" },
    { label: "Run Tests", x: 340, y: 245, color: "#00bcd4" },
    { label: "Export Evaluation", x: 340, y: 290, color: "#607d8b" },
    { label: "Push", x: 340, y: 335, color: "#795548" }
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
| GIT-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/git/SKILL.spec.md` passes |
| GIT-002 | Mermaid sequence diagram renders to PNG | Both diagrams pass mmdc rendering |
| GIT-003 | D3 animation captures 8 keyframes | Filmstrip test captures 8 frames with correct labels |
| GIT-004 | Animation globals present | `getAnimationState` returns correct shape |

## 7. Cross-References

- **Mandatory dependency**: `session-evaluation` skill — loaded during `finish session` for `generate` and `export`
- **Opens**: `session-evaluation` — requires its `generate` and `export` commands
- **Loaded by**: `AGENTS.md` (on demand via `skill git`)
- **Related**: `system-design` skill (design workflow feeds into session commits)
