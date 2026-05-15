# SKILL.spec.md — profiler

## 1. Overview

**Role**: Profiling, flamegraph generation, and benchmarking using Linux perf.

**Persona**: Senior performance engineer with deep expertise in Linux perf, CPU profiling, SIMD optimization.

**Activation Behavior**: Run `check` to verify perf, Release binary, test data, FlameGraph scripts, ffmpeg, vmaf, `.profiler/` dir. Report summary of available/missing. Propose first steps.

**Commands**:

| Command | Description |
|---------|-------------|
| `check` | Verify profiling toolchain and save report to `.profiler/check.json` |
| `setup` | Download/prepare test data, create `.profiler/` directory structure |
| `profile` | Run `perf record` and produce flamegraph; output to `.profiler/perf_archives/<label>/` |
| `benchmark` | Run N iterations with metric collection; output to `.profiler/benchmarks/` |
| `compare` | Compare two benchmark runs side-by-side with regression detection |
| `report` | Bundle profiling session into report; output to `.profiler/reports/` |

## 2. Component Specifications

### `ProfilerEngine`

```
CLASS ProfilerEngine
  METHODS:
    check() -> CheckReport
      verifyPerf() -> bool
      verifyBinary() -> bool
      verifyTestData() -> bool
      verifyFlameGraph() -> bool
      verifyFfmpegVmaf() -> bool
      verifyOutputDir() -> bool
      saveReport(path: str) -> void
    setup(frames: int, resize: str) -> void
      downloadTestData() -> void
      createDirStructure() -> void
      createGitignore() -> void
      ensureFlameGraph() -> void
    profile(events: str[], frames: int) -> ProfileResult
      runPerfRecord() -> void
      generateFoldedStacks() -> void
      generateFlamegraph() -> void
      collectCounterSummary() -> void
    benchmark(iterations: int) -> BenchmarkResult
      runIteration() -> IterationData
      computeSummary() -> Summary
    compare(baseline: str, candidate: str) -> ComparisonResult
      computeDelta() -> Delta[]
      detectRegression() -> bool
    report(profileLabel: str, benchmarkFile: str) -> void
      bundleArtifacts() -> void
```

### `ProfileResult`

```
FILES:
  .profiler/perf_archives/<label>/
    perf.data
    perf.stat
    folded.txt
    flame.svg
    meta.json
```

### `BenchmarkResult`

```
JSON:
  label, timestamp, iterations[{iter, wall_time_ms, metric_1, metric_2}],
  summary{time_avg_ms, time_min_ms, time_max_ms},
  config{source, frames, metrics}
```

## 3. System Architecture

```mermaid
graph TB
    subgraph profiler-skill
        A[check]
        B[setup]
        C[profile]
        D[benchmark]
        E[compare]
        F[report]
    end

    subgraph SupportScripts
        G[common.sh]
        H[setup.sh]
        I[profile.sh]
        J[benchmark.sh]
        K[compare.sh]
    end

    subgraph ExternalTools
        L[Linux perf]
        M[FlameGraph scripts]
        N[ffmpeg]
    end

    subgraph Storage
        O[.profiler/perf_archives/]
        P[.profiler/benchmarks/]
        Q[.profiler/reports/]
        R[test/data/]
    end

    A --> L
    A --> M
    B --> G --> H --> R
    C --> I --> L
    C --> M --> O
    D --> J --> P
    E --> K --> P
    F --> O --> Q
    F --> P --> Q
```

## 4. Detailed Data Flow

```mermaid
sequenceDiagram
    participant User
    participant PR as profiler skill
    participant SH as shell scripts
    participant Perf as linux perf
    participant FS as FileSystem

    User->>PR: check
    PR->>SH: verify perf binary scripts ffmpeg
    SH->>PR: results
    PR->>FS: save .profiler/check.json
    PR->>User: status summary

    User->>PR: setup --frames 50
    PR->>SH: setup.sh download test data
    PR->>SH: setup.sh create dirs
    SH->>FS: create .profiler/ structure
    PR->>User: setup complete

    User->>PR: profile
    PR->>Perf: perf record -e cycles
    PR->>SH: stackcollapse-perf.pl
    PR->>SH: flamegraph.pl
    SH->>FS: save perf.data flame.svg
    PR->>User: profile complete

    User->>PR: benchmark --iter 5
    PR->>SH: benchmark.sh run 5 iterations
    SH->>FS: save benchmark JSON
    PR->>User: benchmark results

    User->>PR: compare base.json cand.json
    PR->>SH: compare.sh compute deltas
    PR->>User: comparison table

    User->>PR: report
    PR->>FS: bundle artifacts
    PR->>User: report path
```

## 5. Visualization

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>profiler skill Flow</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
<div id="animation" style="width:720px;height:480px;font-family:sans-serif;background:#f8f9fa;position:relative;overflow:hidden;">
  <div id="title" style="position:absolute;top:10px;left:20px;font-size:18px;font-weight:bold;color:#333;">Profiler Workflow</div>
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
    { time: 2000, label: "check-toolchain" },
    { time: 4000, label: "setup-testdata" },
    { time: 6000, label: "profile" },
    { time: 8000, label: "benchmark" },
    { time: 10000, label: "compare" },
    { time: 12000, label: "report" },
    { time: 14000, label: "complete" }
  ];

  window.ANIMATION_DURATION_MS = totalDuration;
  window.ANIMATION_KEYFRAMES = keyframes;
  window.ANIMATION_VERIFICATION = keyframes.map(function(kf) {
    return { label: kf.label, hor: 0, ver: 0, precision: 1, logCount: 0 };
  });

  var steps = [
    { label: "Activate", x: 340, y: 20, color: "#4caf50" },
    { label: "Check Toolchain", x: 340, y: 65, color: "#2196f3" },
    { label: "Setup Test Data", x: 340, y: 110, color: "#ff9800" },
    { label: "Profile", x: 340, y: 155, color: "#9c27b0" },
    { label: "Benchmark", x: 340, y: 200, color: "#f44336" },
    { label: "Compare", x: 340, y: 245, color: "#00bcd4" },
    { label: "Report", x: 340, y: 290, color: "#607d8b" },
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
| PRF-001 | Mermaid architecture diagram renders to PNG | `npm run test-artifacts --file source/.opencode/skills/profiler/SKILL.spec.md` passes |
| PRF-002 | Mermaid sequence diagram renders to PNG | Both diagrams pass mmdc rendering |
| PRF-003 | D3 animation captures 8 keyframes | Filmstrip test captures 8 frames |
| PRF-004 | Animation globals present | `getAnimationState` returns expected shape |

## 7. Cross-References

- **Dependencies**: `opensassi` skill (clones FlameGraph), Linux `perf`, FlameGraph scripts at `scripts/FlameGraph/`, ffmpeg, vmaf
- **Implements**: support scripts in `.opencode/skills/profiler/scripts/` (common.sh, setup.sh, profile.sh, benchmark.sh, compare.sh)
- **Loaded by**: `AGENTS.md` (on demand via `skill profiler`)
- **Related**: `asm-optimizer` (shared perf tooling), `opensassi` (FlameGraph dependency)
