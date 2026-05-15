# SKILL.spec.md — issue

## 1. Overview

**Role**: Create, list, show, and close GitHub issues through an interactive propose-revise-create workflow. Issues serve as an audit-trail dashboard of work decomposition for future LLM agents.

**Persona**: Project manager assistant that structures free-form work descriptions into well-formed GitHub issues designed for LLM implementation.

**Activation Behavior**: Verify `gh` is installed and authenticated. Show repo context via `gh repo view` and `gh issue list --limit 5`. Surface available commands.

**Commands**:

| Command | Description |
|---------|-------------|
| `create issue <description>` | Propose-revise-create loop: extract session context, present structured proposal, iterate on feedback, create on explicit approval |
| `list issues [--limit N]` | Run `gh issue list --repo <owner/repo> --limit <N>`, display as table |
| `show issue <number>` | Run `gh issue view <number>`, display full body |
| `close issue <number>` | Confirm with user, then run `gh issue close <number>` |

## 2. Component Specifications

### `IssueManager`

```
CLASS IssueManager
  METHODS:
    checkPrerequisites() -> bool
      verifyGhInstalled() -> bool
      verifyGhAuth() -> bool
    showRepoContext() -> void
      getRepoInfo() -> {name, owner, url}
      listRecentIssues(limit: int) -> Issue[]
    createIssue(description: str) -> void
      extractSessionContext() -> SessionContext
        extractFilesDiscussed() -> str[]
        extractDesignDecisions() -> str[]
        extractTechnicalDetails() -> str[]
        extractUnfinishedItems() -> str[]
      proposeIssue(ctx: SessionContext) -> IssueProposal
      iterateOnFeedback(proposal: IssueProposal) -> void
      createOnGh(issue: IssueProposal) -> str
    listIssues(limit: int) -> Issue[]
    showIssue(number: int) -> str
    closeIssue(number: int) -> void
```

### `IssueProposal`

```
TEMPLATE:
  Title: <3-10 word title>
  Overview: <2-3 sentence summary>
  Scope: <modules, files, directories>
  Context: <why deferred, decisions made>
  Implementation Notes: <patterns, edge cases, signatures>
  Acceptance Criteria: <checkbox list>
  Session Line: Generated from session <id> on <date>
```

## 3. System Architecture

```mermaid
graph TB
    subgraph issue-skill
        A[create issue]
        B[list issues]
        C[show issue]
        D[close issue]
    end

    subgraph ProposeReviseCreate
        E[extract session context]
        F[propose structured issue]
        G[iterate on feedback]
        H[create on approval]
    end

    subgraph External
        I[gh CLI]
        J[GitHub API]
        K[opencode session context]
    end

    A --> E --> F --> G --> H
    B --> I
    C --> I
    D --> I
    E --> K
    H --> I --> J
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant ISS as issue skill
    participant GH as gh CLI
    participant GitHub

    User->>ISS: skill issue
    ISS->>GH: gh auth status
    ISS->>GH: gh repo view
    ISS->>GH: gh issue list
    ISS->>User: repo context + commands

    User->>ISS: create issue add d3 animation
    ISS->>ISS: extract session context
    ISS->>User: issue proposal
    User->>ISS: revise scope section
    ISS->>User: updated proposal
    User->>ISS: looks good create
    ISS->>GH: gh issue create
    GH->>GitHub: POST /repos/issues
    GitHub->>GH: issue URL
    GH->>ISS: confirmation
    ISS->>User: issue URL

    User->>ISS: list issues
    ISS->>GH: gh issue list
    GH->>ISS: issue table
    ISS->>User: display table

    User->>ISS: show issue 42
    ISS->>GH: gh issue view 42
    GH->>ISS: full body
    ISS->>User: display body

    User->>ISS: close issue 42
    ISS->>User: confirm?
    User->>ISS: yes
    ISS->>GH: gh issue close 42
    ISS->>User: closed
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>issue skill Propose-Revise-Create</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Issue Management Workflow</div>
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
    { time: 2000, label: "check-prereqs" },
    { time: 4000, label: "extract-context" },
    { time: 6000, label: "propose-issue" },
    { time: 8000, label: "iterate-feedback" },
    { time: 10000, label: "create-issue" },
    { time: 12000, label: "list-show-close" },
    { time: 14000, label: "complete" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "Check Prerequisites", x: 340, y: 65, color: "#2196f3" },
    { label: "Extract Context", x: 340, y: 110, color: "#ff9800" },
    { label: "Propose Issue", x: 340, y: 155, color: "#9c27b0" },
    { label: "Iterate Feedback", x: 340, y: 200, color: "#f44336" },
    { label: "Create on GitHub", x: 340, y: 245, color: "#00bcd4" },
    { label: "List Show Close", x: 340, y: 290, color: "#607d8b" },
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
| ISS-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/issue/SKILL.spec.md` passes |
| ISS-002 | Mermaid sequence diagram renders to PNG | Both diagrams render successfully via mmdc |
| ISS-003 | D3 animation captures 8 keyframes | Filmstrip captures all 8 frames |
| ISS-004 | Animation globals present | `getAnimationState` returns expected shape |

## 7. Cross-References

- **Depends on**: `gh` CLI (must be installed and authenticated)
- **Used by**: `todo` skill (requires `issue` skill for issue creation)
- **Loaded by**: `AGENTS.md` (on demand via `skill issue`)
- **Related**: `skill-manager` (issue skill is referenced in skill-manager's commit command)
