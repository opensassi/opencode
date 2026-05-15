# SKILL.spec.md — daily-evaluation

## 1. Overview

**Role**: Generate daily developer dashboards from session evaluation documents. Aggregates multiple session reviews into a single structured JSON dashboard with time accounting, AI multiplier analysis, and self-verification audit.

**Persona**: Senior AI analyst and data engineer specializing in developer productivity metrics, session log analysis, and automated dashboard generation.

**Activation Behavior**: Show available commands. If `sessions/daily/` exists, report dashboard count and list session evaluation `.md` files lacking daily reports.

**Commands**:

| Command | Description |
|---------|-------------|
| `create <date>` | Scan `sessions/` for `.md` files matching date, parse structured evaluation fields, generate dashboard JSON to `sessions/daily/<date>.json` |
| `list` | List existing daily dashboards, cross-reference with session files, report dates needing dashboards |

## 2. Component Specifications

### `DailyDashboardGenerator`

```
CLASS DailyDashboardGenerator
  METHODS:
    create(date: str) -> void
      ForwardAnalysis:
        extractFields(sessionMd: str) -> SessionData
        computeDailySummary(sessions: SessionData[]) -> DailySummary
        buildSessionBreakdown(sessions: SessionData[]) -> SessionBreakdown[]
        optionallyIncludeCostEstimation(sessions: SessionData[])
      BackwardAudit:
        auditTimeBounds(sessions: SessionData[])
        auditPerTagSum(sessions: SessionData[])
        auditAiMultiplier(sessions: SessionData[])
        annotateDiscrepancies()
      writeDashboard(summary: DailySummary, path: str) -> void
    list() -> void
      listExistingDashboards() -> Dashboard[]
      listUnmatchedSessions() -> SessionFile[]
      crossReference() -> UnmatchedDate[]
```

### `SessionData`

| Field | Source | Description |
|-------|--------|-------------|
| sessionId | Session ID field | Unique session identifier |
| durationMinutes | Date/Duration | Active duration in minutes |
| prompterTimeMinutes | Prompter Time Estimate | Reading + thinking + writing |
| smeTimeMinutes | Model-Equivalent SME Time Estimate | SME hours from breakdown or range |
| topComponentSummary | Top-Level Component | One-sentence summary |
| tags | Aggregation Tags | Comma-separated keywords |
| humanConfidence | Derived | high / medium / low |

## 3. System Architecture

```mermaid
graph TB
    subgraph daily-evaluation
        A[create command]
        B[list command]
    end

    subgraph ForwardAnalysis
        C[extract session fields]
        D[compute daily summary]
        E[build session breakdown]
        F[optional cost estimation]
    end

    subgraph BackwardAudit
        G[audit time bounds]
        H[audit per-tag sums]
        I[audit AI multiplier]
        J[annotate discrepancies]
    end

    subgraph Storage
        K[sessions/ evaluation md files]
        L[sessions/daily/ dashboard json files]
    end

    A --> ForwardAnalysis
    ForwardAnalysis --> BackwardAudit
    BackwardAudit --> L
    B --> K
    B --> L
    C --> K
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant DE as daily-evaluation
    participant FS as FileSystem

    User->>DE: list
    DE->>FS: read sessions/daily/ dir
    DE->>FS: read sessions/ md files
    DE->>User: dashboard list + unmatched

    User->>DE: create 2026-05-11
    DE->>FS: scan sessions/ for 2026-05-11- md files
    alt no matching files
        DE->>User: error no sessions for date
    else files found
        DE->>DE: extract fields from each file
        DE->>DE: compute daily summary
        DE->>DE: build session breakdown
        DE->>DE: allocate tags pro-rata
        DE->>DE: backward audit
        alt discrepancies found
            DE->>DE: correct and annotate
        end
        DE->>FS: write sessions/daily/2026-05-11.json
        DE->>User: dashboard created
    end
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>daily-evaluation Dashboard Flow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Daily Evaluation Dashboard Pipeline</div>
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
    { time: 2000, label: "list-dashboards" },
    { time: 4000, label: "scan-sessions" },
    { time: 6000, label: "extract-fields" },
    { time: 8000, label: "compute-summary" },
    { time: 10000, label: "backward-audit" },
    { time: 12000, label: "write-dashboard" },
    { time: 14000, label: "complete" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "List Dashboards", x: 340, y: 65, color: "#2196f3" },
    { label: "Scan Session Files", x: 340, y: 110, color: "#ff9800" },
    { label: "Extract Fields", x: 340, y: 155, color: "#9c27b0" },
    { label: "Compute Summary", x: 340, y: 200, color: "#f44336" },
    { label: "Backward Audit", x: 340, y: 245, color: "#00bcd4" },
    { label: "Write Dashboard", x: 340, y: 290, color: "#607d8b" },
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
| DE-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/daily-evaluation/SKILL.spec.md` passes |
| DE-002 | Mermaid sequence diagram renders to PNG | Both mermaid diagrams render successfully |
| DE-003 | D3 animation captures 8 keyframes | Filmstrip captures frame-0 through frame-7 |
| DE-004 | Animation globals present | `getAnimationState` returns `hor`, `ver`, `precision`, `logCount` |

## 7. Cross-References

- **Depends on**: session-evaluation skill (reads its `.md` output files from `sessions/`)
- **Opens**: `session-evaluation` — reads session evaluation markdown files
- **Used by**: `AGENTS.md` (on demand via `skill daily-evaluation`)
- **Related**: git skill (session artifacts in `sessions/` directory)
