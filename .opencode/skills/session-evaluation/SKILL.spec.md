# SKILL.spec.md — session-evaluation

## 1. Overview

**Role**: Analyze the current conversation, generate a structured session evaluation report, and optionally export the full session archive (JSON export + bzip2 compression + SHA-256 hash + markdown sidecar).

**Persona**: Senior project management analyst and technical writer with deep expertise in reviewing AI-assisted development sessions, extracting objective metrics, and producing structured auditable evaluation reports.

**Activation Behavior**: Show available commands immediately. Do not read files or start evaluation. Wait for user command. Full conversation history is available in agent context.

**Commands**:

| Command | Description |
|---------|-------------|
| `generate` | Analyze entire conversation history, produce structured Session Evaluation Summary following embedded prompt template |
| `export` | Run full session export pipeline: write evaluation sidecar `.md`, create compressed `.json.bz2` archive with `.sha256` hash, verify integrity |

## 2. Component Specifications

### `SessionEvaluator`

```
CLASS SessionEvaluator
  METHODS:
    showCommands() -> void
    generate() -> EvaluationReport
      readConversation() -> Conversation
      extractMetadata() -> SessionMetadata
        estimateDuration() -> int
        countUserMessages() -> int
        countToolCalls() -> ToolCall[]
        identifyDecisions() -> Decision[]
      applyTemplate(meta: SessionMetadata) -> str
        fillSessionId() -> str
        fillDuration() -> str
        fillProjectContext() -> str
        fillTopLevelComponent() -> str
        fillSecondLevelModules() -> str[]
        fillPrompterContributions() -> str
        fillModelContributions() -> str
        fillPrompterTimeEstimate() -> TimeBreakdown
        fillSmeTimeEstimate() -> TimeBreakdown
        fillSmeExpertise() -> str[]
        fillAggregationTags() -> str[]
    export() -> void
      getSessionId() -> str
      getTitleSlug() -> str
      writeSidecar(content: str, path: str) -> void
      runExportScript(slug: str, id: str) -> void
      verifyArchive(path: str) -> bool
```

### `EvaluationReport`

```
TEMPLATE:
  Session ID: <date-topic-slug>
  Date / Duration: <date>; prompter active hours estimate
  Project / Context: <one paragraph>
  Top-Level Component: <primary deliverable>
  Second-Level Modules: <bullet list>
  Prompter Contributions: <human input summary>
  Model Contributions: <AI output summary>
  Prompter Time Estimate: reading, thinking, writing hours with total
  Model-Equivalent SME Time Estimate: <hours with task breakdown>
  Required SME Expertise: <6-12 granular bullet points>
  Aggregation Tags: <5-12 comma-separated keywords>
```

## 3. System Architecture

```mermaid
graph TB
    subgraph session-evaluation
        A[generate]
        B[export]
    end

    subgraph GeneratePipeline
        C[read conversation context]
        D[extract metadata]
        E[apply evaluation template]
        F[output markdown report]
    end

    subgraph ExportPipeline
        G[get session ID]
        H[get title slug]
        I[write sidecar md]
        J[run export-session.sh]
        K[verify bzip2 integrity]
    end

    subgraph Storage
        L[sessions/ md sidecar]
        M[sessions/ json.bz2 archive]
        N[sessions/ sha256 hash]
    end

    A --> GeneratePipeline
    B --> ExportPipeline
    I --> L
    J --> M
    J --> N
    K --> M
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant SE as session-evaluation
    participant Context as conversation context
    participant FS as FileSystem
    participant Script as export-session.sh

    User->>SE: generate
    SE->>Context: read full conversation
    SE->>SE: estimate duration message count
    SE->>SE: extract decisions tool calls
    SE->>SE: apply evaluation template
    SE->>User: output markdown report

    User->>SE: export
    SE->>SE: get session ID from opencode
    SE->>SE: get title slug from generate
    SE->>FS: write sidecar to sessions/
    SE->>Script: run export-session.sh
    Script->>FS: create json.bz2
    Script->>FS: create sha256
    SE->>Script: bzip2 -t verify
    SE->>User: export complete

    User->>SE: free-form feedback
    SE->>User: acknowledge revise proposal
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>session-evaluation Flow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Session Evaluation Pipeline</div>
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
    { time: 2000, label: "show-commands" },
    { time: 4000, label: "generate-eval" },
    { time: 6000, label: "apply-template" },
    { time: 8000, label: "output-report" },
    { time: 10000, label: "export-archive" },
    { time: 12000, label: "verify-integrity" },
    { time: 14000, label: "complete" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "Show Commands", x: 340, y: 65, color: "#2196f3" },
    { label: "Generate Eval", x: 340, y: 110, color: "#ff9800" },
    { label: "Apply Template", x: 340, y: 155, color: "#9c27b0" },
    { label: "Output Report", x: 340, y: 200, color: "#f44336" },
    { label: "Export Archive", x: 340, y: 245, color: "#00bcd4" },
    { label: "Verify Integrity", x: 340, y: 290, color: "#607d8b" },
    { label: "Complete", x: 340, y: 335, color: "#795548" }
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
| SE-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/session-evaluation/SKILL.spec.md` passes |
| SE-002 | Mermaid sequence diagram renders to PNG | Both diagrams render via mmdc |
| SE-003 | D3 animation captures 8 keyframes | Filmstrip captures all 8 frames |
| SE-004 | Animation globals present | `getAnimationState` returns expected shape |

## 7. Cross-References

- **Depends on**: `opencode session list` (for session ID); `sessions/export-session.sh` (for archive creation)
- **Dependency of**: `git` skill (requires `generate` and `export` during `finish session`)
- **Dependency of**: `daily-evaluation` skill (reads evaluation `.md` files from `sessions/`)
- **Loaded by**: `AGENTS.md` (on demand via `skill session-evaluation`); loaded by `git` skill
