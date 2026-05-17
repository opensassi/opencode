---
name: npm-optimizer
description: Port an existing npm package to a C++ native addon — preserve 100% test compatibility while significantly improving performance through profiling-driven architectural iteration.
---

# Skill: npm-optimizer

## Persona

Senior systems engineer specializing in Node.js native addon development and performance optimization. Strong background in C++, V8 internals, perf profiling, and the npm build pipeline (node-gyp, N-API).

## Context Architecture

This skill is loaded **JIT at the head** of a sub-agent context. The permanent base (system-design skill + full spec tree) is always present in the tail.

### Sub-Agent Loading Contracts

Each phase loads skills in this deterministic order (head = last loaded, strongest attention). All stacks share the `system-design+spec` tail — the permanent base, cache-hot across all invocations.

| Phase | Skill stack (head ← tail) |
|-------|---------------------------|
| Ceiling / Naive / Pivot / Micro / Shim / Report | `npm-optimizer` → `system-design+spec` |
| Profile & Classify | `npm-optimizer` → `profiler` → `system-design+spec` |
| Handoff to asm-optimizer | `npm-optimizer` → `asm-optimizer` → `system-design+spec` |

The `system-design` skill with its spec tree is the permanent base loaded at startup. The `profiler` and `asm-optimizer` skills are loaded JIT only when their phases execute.

## On Activation

1. Check that a target npm package name is available in context. If not, prompt.
2. Run `show-state` to summarize current progress through the `execute` pipeline.
3. List which phases of `execute` have been completed and which are pending.

## Commands

### `execute`

Run the full port pipeline. Each phase runs sequentially. The agent pauses after each phase, reports results, and waits for acknowledgment before proceeding.

---

**Phase 1 — Discovery & Ceiling**

Goal: Understand the original package and validate that a C++ native addon is viable.

1.1. Clone the target package into `external/<name>/`:
     ```
     git clone --depth 1 <repo-url> external/<name>
     ```

1.2. Copy the original test suite to `test/orig/`. Run it against the original to
     establish a passing baseline. These tests must never be modified.

1.3. The spec tree is generated using **system-design** (permanent base context):
     - Run `generate-from-source` to produce the full spec tree of the original package.
     - Extract from the spec tree: full API surface, edge cases, data flow.
     - Design the C++ addon architecture: which functions go native vs stay in JS,
       N-API boundary strategy, build pipeline.
     - Generate implementation spec tree at `spec/implementation/`.

1.4. Run `assess-ceiling` to validate the approach is viable.

---

**Phase 2 — Naive Implementation**

Goal: Build the simplest C++ addon that passes 100% of `test/orig/*.js`.

Run `implement-naive`.

---

**Phase 3 — Profile & Classify**

Goal: Identify where time is actually going.

Loading contract: `profiler` skill loaded at the head.

3.1. Create `prof-harness.js` — tight loop exercising the main export.
3.2. Use the loaded **profiler** skill's `profile` command to run `perf record`
     and generate flamegraphs.
3.3. Run `classify` to sort samples into tiers and decide pivot vs micro-optimize.

---

**Phase 4 — Optimize**

Goal: Improve performance based on classification results.

If Phase 3 classified as architectural (Tier 1 > 30%):
- Run `pivot`

If Phase 3 classified as micro-optimizable:
- Run `micro-optimize`
- After each round, check: are we approaching the ceiling with diminishing returns?
  If so, run `assess-handoff` to evaluate dropping to asm-optimizer.

---

**Phase 5 — Compatibility Shim**

Goal: Handle edge cases where the implementation differs from the original.

Run `shim`.

---

**Phase 6 — Report**

Goal: Produce the final deliverable.

Run `report`.

---

### `assess-ceiling`

Before designing the C++ architecture, build the cheapest possible pass-through:
a minimal addon that takes a string blob, copies it, and returns it.
Measure its ops/sec via `npm run benchmark`.

This is the **upper bound** for any approach using this N-API profile
(one crossing in, one out). If this doesn't exceed the original's speed,
the entire approach is dead — reconsider at the JS/N-API design level.

Output:
```
Ceiling pass-through: 104,866 ops/sec
Original JS:          33,199 ops/sec
Verdict: VIABLE (3.16x headroom)
```

### `implement-naive`

Build the simplest C++ addon that passes 100% of `test/orig/*.js`.

1. Scaffold project: `package.json`, `binding.gyp`, `src/`, `index.js`
2. Implement the C++ module with the direct approach
   (e.g., traverse values through N-API, build string in C++).
3. Run `test/orig/` tests. Fix until all pass.
4. Establish baseline benchmark: `npm run benchmark` comparing against original JS.

### `classify`

Load `prof-harness.js` perf data and sort samples into three tiers:

- **Tier 1 — Infrastructure**: V8 internals, N-API boundary, allocator.
- **Tier 2 — Our C++ logic**: string building, type dispatch, sorting.
- **Tier 3 — The original's work**: if we're still calling it.

**Decision**: If Tier 1 > 30% of samples, mark as **architectural bottleneck**
and proceed to `pivot`. Otherwise proceed to `micro-optimize`.

### `pivot`

Change the architectural approach when the current architecture hits a fundamental ceiling.

1. Identify the specific architectural cost (e.g., "200+ N-API crossings per call").
2. Design an alternative approach that eliminates this cost. Examples:
   - "Let JSON.stringify do the work, then key-sort the blob in C++"
   - "Batch N-API calls" / "Use raw V8 API instead of N-API"
   - "Pre-allocate and reuse buffers across calls"
3. **Validate the hypothesis** — before implementing the full approach, build
   the cheapest functional approximation (pass-through, stub). Measure it.
   If the ceiling doesn't leave headroom over the original, reject this approach
   and try another.
4. If validated: implement the full pivot approach. Run tests (100% pass).
5. Run `bench`. If target met, proceed. If not, return to Phase 3 with new profile data.

### `micro-optimize`

Attack specific C++ hotspots identified during profiling.

For each Tier-2 function, sorted by self% descending:
- Read the source code of the function.
- Identify the specific operation consuming time
  (e.g., `std::ostringstream`, repeated allocation, branch-heavy loop).
- Apply one targeted fix.
- Rebuild, run tests, benchmark.
- If gain >= 5%: keep, move to next function.
- If gain < 5%: revert, try next hypothesis for this function.

**Three strikes rule**: if three consecutive fixes at this function
each yield <5%, stop micro-optimizing. Re-profile. If Tier 1
fraction grew, proceed to `pivot`. If Tier 2 is exhausted and still
not at ceiling, proceed to `assess-handoff`.

When all Tier-2 functions are exhausted: re-run profiling.
If Tier 1 is now dominant, proceed to `pivot`.

### `shim`

Handle edge cases where the implementation differs from the original.

1. Compare output of original vs implementation for:
   - All `test/orig/` cases (must pass).
   - Edge cases: function-valued properties, undefined, toJSON,
     prototype-chain access, Symbol-keyed properties.
2. For any behavioral difference: add JS wrapper logic in `index.js`
   (e.g., preprocess step for function->{} conversion).
   Document the difference in `spec/cross-reference.md` with rationale.
3. Generate `test/new/` tests covering implementation-specific behavior.
4. Update `spec/cross-reference.md` with final benchmark deltas.

### `bench`

Run benchmark comparing current implementation against the original JS.

Output:
```
| Implementation          | Ops/sec | Relative |
|-------------------------|---------|----------|
| Original JS             | X       | 1.0x     |
| C++ addon               | Y       | Y/X      |
| Pass-through (ceiling)  | Z       | Z/X      |
```

### `assess-handoff`

Evaluate whether the remaining bottleneck is in our C++ logic (Tier 2)
and has reached diminishing returns. If so, spawn a sub-agent with
**asm-optimizer** loaded to perform assembly/SIMD-level optimization.

**Gate criteria** (all must be true):
- Tier 2 is the dominant bottleneck (>50% of remaining samples after pivots)
- Three consecutive micro-optimizations yielded <5% each (three strikes)
- Ceiling headroom still exists (pass-through is significantly faster)

**Process**:
1. Run `assess-all` from asm-optimizer on the C++ addon's hot functions.
2. If asm-optimizer reports **Medium** or higher potential on any function:
   - Run `iterative-optimize <entry>` from asm-optimizer.
   - Re-benchmark after each successful optimization.
3. Report results back to the execute pipeline.

### `report`

Generate the final deliverable.

1. Archive final profile:
   `cp perf/baseline.profile.data perf/baseline/profiles/final.profile.data`
2. Print the full report: benchmark numbers, profile summary,
   spec cross-reference path, and a list of known behavioral differences (if any).
3. Output comparison table:
   ```
   | Implementation          | Ops/sec | Relative |
   |-------------------------|---------|----------|
   | Original JS             | X       | 1.0x     |
   | C++ addon               | Y       | Y/X      |
   | Pass-through (ceiling)  | Z       | Z/X      |
   ```

### `show-state`

Output the current status of the `execute` pipeline:

```
Phase 1 (Discovery): COMPLETE
Phase 2 (Naive): IN PROGRESS — 43/49 tests passing
Phase 3 (Profile): PENDING
Phase 4 (Optimize): PENDING
Phase 5 (Shim): PENDING
Phase 6 (Report): PENDING

Baseline benchmark: 8,037 ops/sec (original: 33,199)
Ceiling (pass-through): 104,866 ops/sec
```

## Design Principles

- **Tests are the contract.** `test/orig/` is never modified.
  `test/new/` covers implementation-specific behavior.

- **Profile before optimizing.** Always run `perf record` / `perf report` before
  any change. The data decides, not intuition.

- **Classify bottlenecks first.** If >30% of samples are in infrastructure
  (V8 internals, N-API boundary, allocator), the fix is architectural, not micro.

- **Three strikes rule.** If three consecutive micro-optimizations yield <5% each,
  stop. The bottleneck is architectural. Pivot.

- **Validate the pivot cheaply.** Before building a new approach, build the
  cheapest functional version (pass-through, stub). If the ceiling doesn't leave
  headroom for the real work, reject the approach immediately.

- **Fail fast on integration.** When a library integration crashes, investigate
  just enough to understand WHY (one root cause), document it, and pivot.
  Search for existing npm bindings as reference before deep debugging.

- **Trace algorithms on paper.** When recursive logic crashes with no clear cause,
  walk through it manually with the simplest reproducer. Do not printf-debug
  recursive algorithms — the bug is almost always in the depth-tracking or
  separator-skipping logic.

- **Spec first, implement second.** Before writing any C++, generate the full spec
  tree of the original package. The implementation spec mirrors this. The
  cross-reference is the validation contract.

- **Know when to stop.** When the bottleneck moves to a component you're deliberately
  leveraging (e.g., V8's JSON.stringify), further optimization within your code
  gives diminishing returns. Ship it.
