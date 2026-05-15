# SKILL.spec.md — system-design-review

## 1. Overview

**Role**: Critically audit technical specifications using a panel of seven domain experts, with reports saved to `.artifacts/`.

**Persona**: Technical Specification Review Agent. Output must be strictly the final consolidation — internal deliberation must not be emitted.

**Activation Behavior**: Check for stale reviews via `node scripts/check-artifacts.js --errors`. Show available commands. Wait for explicit command.

**Commands**:

| Command | Description |
|---------|-------------|
| `review all` | Run full panel review on root `technical-specification.md` AND all sub-module `.spec.md` files |
| `review <sub-module>` | Run panel review on a specific sub-module |
| `review <file-path>` | Run panel review on a single `.spec.md` file |
| `review stale` | Regenerate reviews for spec files whose source has changed |

## 2. Component Specifications

### `ReviewPanel`

```
CLASS ReviewPanel
  MEMBERS:
    experts: Expert[7]
  METHODS:
    reviewAll() -> void
      readRootSpec() -> str
      enumerateModules() -> ModuleRef[]
      forEach spec: runPanel(spec) -> void
    reviewSubModule(name: str) -> void
      resolveModule(name: str) -> ModuleRef
      readSpecFiles(module: ModuleRef) -> str[]
      forEach spec: runPanel(spec) -> void
    reviewFilePath(path: str) -> void
      validateSpecFile(path: str) -> bool
      runPanel(spec: str) -> void
    reviewStale() -> void
      runCheckArtifacts() -> StaleSpec[]
      forEach stale: runPanel(spec) -> void
```

### `Expert` (interface)

```
INTERFACE Expert
  domain: str
  reviewMethods: Method[10]
  METHODS:
    review(spec: str) -> Finding[]
    translateToUnifiedVocabulary(finding: Finding) -> str
    assignSeverity(finding: Finding) -> Severity
```

### `PanelExperts`

```
EXPERTS:
  1. CryptographyExpert
  2. DigitalPhysicalSecurityExpert
  3. DistributedSystemsExpert
  4. SoftwareEngineeringExpert
  5. UserExperienceExpert
  6. LegalComplianceExpert
  7. EnergyAnalysisExpert
```

### `ConsolidatedOutput`

```
FORMAT:
  # Technical Specification Review -- <SpecFileName>
  ## Part 1: Consolidated Revisions
    ### Revision N
      Section affected: <ref>
      Original text: <quote>
      Proposed change: <text>
      Reason: <explanation>
      Severity: Critical|Major|Minor
  ## Part 2: Expert Issue Tallies (Debug Output)
    ### <ExpertName>
      1. (Severity) <issue>
      ...
    ### Summary Table
```

## 3. System Architecture

```mermaid
graph TB
    subgraph system-design-review
        A[review all]
        B[review sub-module]
        C[review file-path]
        D[review stale]
    end

    subgraph PanelExperts
        E[CryptographyExpert]
        F[DigitalPhysicalSecurityExpert]
        G[DistributedSystemsExpert]
        H[SoftwareEngineeringExpert]
        I[UserExperienceExpert]
        J[LegalComplianceExpert]
        K[EnergyAnalysisExpert]
    end

    subgraph Processing
        L[Individual Review]
        M[Severity Weighting]
        N[Conflict Resolution]
        O[Consolidation]
    end

    subgraph Storage
        P[.artifacts/review.md]
        Q[sub-module .artifacts/review.md]
        R[scripts/check-artifacts.js]
    end

    A --> PanelExperts
    B --> PanelExperts
    C --> PanelExperts
    D --> R --> PanelExperts
    PanelExperts --> L --> M --> N --> O
    O --> P
    O --> Q
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant SDR as system-design-review
    participant Panel as Seven Experts
    participant FS as FileSystem
    participant Script as check-artifacts.js

    User->>SDR: skill system-design-review
    SDR->>Script: check for stale reviews
    Script->>SDR: stale list
    SDR->>User: stale notice + commands

    User->>SDR: review technical-specification.md
    SDR->>Panel: invoke seven experts
    Panel->>Panel: each reads spec
    Panel->>Panel: each applies 10 review methods
    Panel->>Panel: assign severity to each finding
    Panel->>Panel: translate to unified vocabulary
    alt conflict between experts
        Panel->>Panel: apply conflict resolution rules
    end
    Panel->>Panel: consolidate into revisions
    Panel->>Panel: sort by severity + domain priority
    Panel->>SDR: consolidated output
    SDR->>FS: write .artifacts/review.md
    SDR->>User: review complete

    User->>SDR: review stale
    SDR->>Script: run check-artifacts.js
    Script->>SDR: stale spec files
    SDR->>Panel: review each stale spec
    SDR->>FS: write each review
    SDR->>User: stale reviews regenerated
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>system-design-review Flow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">System Design Review Pipeline</div>
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
    { time: 2000, label: "check-stale" },
    { time: 4000, label: "invoke-panel" },
    { time: 6000, label: "individual-review" },
    { time: 8000, label: "consolidate" },
    { time: 10000, label: "write-review" },
    { time: 12000, label: "stale-regeneration" },
    { time: 14000, label: "complete" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "Check Stale", x: 340, y: 65, color: "#2196f3" },
    { label: "Invoke Panel", x: 340, y: 110, color: "#ff9800" },
    { label: "Individual Review", x: 340, y: 155, color: "#9c27b0" },
    { label: "Consolidate", x: 340, y: 200, color: "#f44336" },
    { label: "Write Review", x: 340, y: 245, color: "#00bcd4" },
    { label: "Stale Regeneration", x: 340, y: 290, color: "#607d8b" },
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
| SDR-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/system-design-review/SKILL.spec.md` passes |
| SDR-002 | Mermaid sequence diagram renders to PNG | Both diagrams render via mmdc |
| SDR-003 | D3 animation captures 8 keyframes | Filmstrip captures 8 frames |
| SDR-004 | Animation globals present | `getAnimationState` returns expected shape |

## 7. Cross-References

- **Independent auditor**: Must NOT invoke `system-design` skill — critiques, not designs
- **Depends on**: `scripts/check-artifacts.js` for staleness detection; `scripts/extract-artifacts.js`, `scripts/test-artifacts.js` for validation
- **Loaded by**: `AGENTS.md` (on demand via `skill system-design-review`)
- **Reviews**: `technical-specification.md` and all sub-module `.spec.md` files
- **Related**: `system-design` (produces the specs that this skill reviews)
