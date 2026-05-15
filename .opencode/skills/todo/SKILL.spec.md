# SKILL.spec.md — todo

## 1. Overview

**Role**: Creates linked GitHub issues and debugging skills from session context for unfinished work.

**Persona**: Technical writer and project manager — extracts structured summaries from session conversations, then produces self-contained debugging skills for future agents.

**Activation Behavior**: Show workflow. Requires the `issue` skill — loads it before operating.

**Commands**:

| Command | Description |
|---------|-------------|
| `extract <name>` | Scan session context for unfinished work, output Issue Body + Skill Content |
| `propose-skill <name>` | From extract output + issue number, draft a debugging skill at `.opencode/skills/<name>-<issue#>/SKILL.md` |
| `save-skill` | Write currently agreed SKILL.md to disk and register in `opencode.json` |

## 2. Component Specifications

### `TodoWorkflow`

```
CLASS TodoWorkflow
  METHODS:
    activate() -> void
      showWorkflow() -> void
      loadIssueSkill() -> void
    extract(name: str) -> void
      scanSessionContext() -> SessionSummary
        findUnfinishedWork() -> UnfinishedItem[]
        checkExperimentDirs() -> ExperimentRef[]
      outputIssueBody() -> IssueBody
        buildTitle() -> str
        buildOverview() -> str
        buildScope() -> str
        buildContext() -> str
        buildImplementationNotes() -> str
        buildAcceptanceCriteria() -> str[]
      outputSkillContent() -> SkillContent
        buildWhatSucceeded() -> str
        buildWhatWasTried() -> str
        buildWhatRemains() -> str
        buildKeyTechnicalDetails() -> str
        buildExperimentReferences() -> str
    proposeSkill(name: str) -> void
      getIssueNumber() -> int
      draftSkill(name: str, issueNum: int) -> SkillDraft
      presentForReview(skill: SkillDraft) -> void
    saveSkill() -> void
      validateFrontmatter(skill: SkillDraft) -> bool
      writeSkillFile(path: str) -> void
      updateOpencodeJson(name: str) -> void
      confirmWrite() -> void
```

### `SkillDraft`

```
TEMPLATE:
  ---
  name: <name>-<issue#>
  description: <one-line summary>
  ---
  # Skill: <name>-<issue#>
  ## Issue Reference: GitHub issue URL
  ## Dependencies
  ## Previous Work: What Succeeded, What Was Tried, What Remains
  ## Persona
  ## On Activation
  ## Commands: setup, test, gdb-trace, fix, bench, report-fix
  ## Debugging Context
  ## Files Reference
  ## Design Principles
```

## 3. System Architecture

```mermaid
graph TB
    subgraph todo-skill
        A[extract]
        B[propose-skill]
        C[save-skill]
    end

    subgraph ExtractionPipeline
        D[scan session context]
        E[extract unfinished work]
        F[check experiment dirs]
        G[output issue body]
        H[output skill content]
    end

    subgraph IssueSkill
        I[create issue]
    end

    subgraph Outputs
        J[GitHub issue]
        K[.opencode/skills/name-issue/SKILL.md]
    end

    A --> ExtractionPipeline
    ExtractionPipeline --> G --> I --> J
    ExtractionPipeline --> H --> B
    B --> K
    C --> K
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant TD as todo skill
    participant ISS as issue skill
    participant FS as FileSystem

    User->>TD: skill todo
    TD->>TD: show workflow
    TD->>ISS: skill issue

    User->>TD: extract rotateBlocks-fix
    TD->>TD: scan session context
    TD->>TD: find unfinished items
    TD->>TD: check perf/experiments/
    TD->>User: issue body + skill content

    User->>ISS: create issue
    ISS->>User: issue URL
    User->>TD: propose-skill rotateBlocks-fix
    TD->>TD: draft skill from extract
    TD->>User: skill proposal
    alt feedback
        User->>TD: revise
        TD->>User: updated proposal
    end
    User->>TD: save-skill
    TD->>FS: write SKILL.md
    TD->>FS: update opencode.json
    TD->>User: skill created

```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>todo skill Workflow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Todo Skill Workflow</div>
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
    { time: 2000, label: "load-issue-skill" },
    { time: 4000, label: "extract-context" },
    { time: 6000, label: "create-issue" },
    { time: 8000, label: "propose-skill" },
    { time: 10000, label: "save-skill" },
    { time: 12000, label: "register" },
    { time: 14000, label: "complete" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "Load Issue Skill", x: 340, y: 65, color: "#2196f3" },
    { label: "Extract Context", x: 340, y: 110, color: "#ff9800" },
    { label: "Create Issue", x: 340, y: 155, color: "#9c27b0" },
    { label: "Propose Skill", x: 340, y: 200, color: "#f44336" },
    { label: "Save Skill", x: 340, y: 245, color: "#00bcd4" },
    { label: "Register in Config", x: 340, y: 290, color: "#607d8b" },
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
| TODO-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/todo/SKILL.spec.md` passes |
| TODO-002 | Mermaid sequence diagram renders to PNG | Both diagrams render via mmdc |
| TODO-003 | D3 animation captures 8 keyframes | Filmstrip captures 8 frames |
| TODO-004 | Animation globals present | `getAnimationState` returns expected shape |

## 7. Cross-References

- **Mandatory dependency**: `issue` skill — loads it on activation for `create issue`
- **Related to**: `asm-optimizer` (checks `perf/experiments/` for experiment data)
- **Loaded by**: `AGENTS.md` (on demand via `skill todo`)
- **Does NOT modify**: `skill-manager` or `issue` skills themselves
