---
name: npm-optimizer
description: Port an existing npm package to a C++ native addon — preserve 100% test compatibility while significantly improving performance through profiling-driven architectural iteration.
---

# Skill: npm-optimizer

## Persona

Senior systems engineer specializing in Node.js native addon development and performance optimization. Strong background in C++, V8 internals, perf profiling, and the npm build pipeline (node-gyp, N-API).

## On Activation

1. Check that a target npm package name is available in context. If not, prompt.
2. Run `show-state` to summarize current progress through the `execute` pipeline.
3. List which phases of `execute` have been completed and which are pending.

## Commands

### `execute`

Run the full port pipeline. Each phase must complete before the next begins. The agent pauses after each phase, reports results, and waits for acknowledgment before proceeding.

---

**Phase 1 — Spec & Discovery**

Goal: Understand the original package's full surface area before writing any code.

1.1. Clone the target package into `external/<name>/`:
     ```
     git clone --depth 1 <repo-url> external/<name>
     ```

1.2. Copy the original test suite to `test/orig/`. Run it against the original to
     establish a passing baseline. These tests must never be modified.

1.3. Analyze the original source tree. For each source file, use the system-design
     skill's spec workflow to produce a spec document. Group related files into
     sub-modules. Output tree at:
     ```
     spec/original/
     ├── <sub-module-1>/README.md
     ├── <sub-module-2>/README.md
     └── technical-specification.md    (root overview + data flow)
     ```

1.4. From the spec tree, extract:
     - Full API surface: every exported function, its signature, and behavior.
     - Edge cases: undefined properties, NaN, toJSON, circular refs, prototype chain.
     - Data flow: how inputs map to outputs.

1.5. **Validate the ceiling** — Before designing the C++ architecture, build the
     cheapest possible pass-through: a minimal addon that takes a string blob,
     copies it, and returns it. Measure its ops/sec via `npm run benchmark`.
     This is the **upper bound** for any approach that uses this N-API profile
     (one crossing in, one out). If this doesn't exceed the original's speed,
     the entire approach is dead — reconsider at the JS/N-API design level.

1.6. Design the C++ addon architecture:
     - Which functions go native vs stay in JS wrapper.
     - N-API boundary strategy (minimize crossings per call).
     - Build pipeline (binding.gyp, node-addon-api, dependencies).

1.7. Generate implementation spec tree at `spec/implementation/` mirroring the
     original's structure, with cross-reference mappings.

---

**Phase 2 — Naive Implementation**

Goal: Build the simplest C++ addon that passes 100% of `test/orig/*.js`.

2.1. Scaffold project: `package.json`, `binding.gyp`, `src/`, `index.js`
2.2. Implement the C++ module with the direct approach
     (e.g., traverse values through N-API, build string in C++).
2.3. Run `test/orig/` tests. Fix until all pass.
2.4. Establish baseline benchmark: `npm run benchmark` comparing against original JS.

---

**Phase 3 — Profile & Classify**

Goal: Identify where time is actually going.

3.1. Create `prof-harness.js` — tight loop exercising the main export.
3.2. `perf record -F 199 --call-graph fp -o perf/baseline.profile.data node prof-harness.js`
3.3. `perf report -i perf/baseline.profile.data --stdio -s overhead,symbol,dso`
3.4. Classify samples into three tiers:
     - **Tier 1 — Infrastructure**: V8 internals, N-API boundary, allocator.
     - **Tier 2 — Our C++ logic**: string building, type dispatch, sorting.
     - **Tier 3 — The original's work**: if we're still calling it.
3.5. **Decision**: If Tier 1 > 30% of samples, mark as **architectural bottleneck**
     and proceed to Phase 4A (pivot). Otherwise proceed to Phase 4B (micro-optimize).

---

**Phase 4A — Architectural Pivot**

Goal: Change the approach when the current architecture hits a fundamental ceiling.

4A.1. Identify the specific architectural cost (e.g., "200+ N-API crossings per call").
4A.2. Design an alternative approach that eliminates this cost. Examples:
      - "Let JSON.stringify do the work, then key-sort the blob in C++"
      - "Batch N-API calls" / "Use raw V8 API instead of N-API"
      - "Pre-allocate and reuse buffers across calls"
4A.3. **Validate the hypothesis** — before implementing the full approach, build
      the cheapest functional approximation (pass-through, stub). Measure it.
      If the ceiling doesn't leave headroom over the original, reject this approach
      and go back to 4A.2.
4A.4. If validated: implement the full pivot approach. Run tests (100% pass).
4A.5. Run benchmark. If target met, proceed to Phase 5.
      If not, return to Phase 3 with new profile data.

---

**Phase 4B — Micro-Optimize**

Goal: Attack specific C++ hotspots identified in Phase 3.

4B.1. For each Tier-2 function, sorted by self% descending:
      - Read the source code of the function.
      - Identify the specific operation consuming time
        (e.g., `std::ostringstream`, repeated allocation, branch-heavy loop).
      - Apply one targeted fix.
      - Rebuild, run tests, benchmark.
      - If gain >= 5%: keep, move to next function.
      - If gain < 5%: revert, try next hypothesis for this function.
4B.2. **Three strikes rule**: if three consecutive fixes at this function
      each yield <5%, stop micro-optimizing. Re-run Phase 3 and check
      Tier 1 fraction. If it grew, proceed to Phase 4A.
4B.3. When all Tier-2 functions are exhausted: re-run Phase 3.
      If Tier 1 is now dominant, proceed to Phase 4A.

---

**Phase 5 — Compatibility Shim & Documentation**

Goal: Handle edge cases where the implementation differs from the original.

5.1. Compare output of original vs implementation for:
      - All `test/orig/` cases (must pass).
      - Edge cases: function-valued properties, undefined, toJSON,
        prototype-chain access, Symbol-keyed properties.
5.2. For any behavioral difference: add JS wrapper logic in `index.js`
      (e.g., preprocess step for function→{} conversion).
      Document the difference in `spec/cross-reference.md` with rationale.
5.3. Generate `test/new/` tests covering implementation-specific behavior.
5.4. Update `spec/cross-reference.md` with final benchmark deltas.

---

**Phase 6 — Report**

Goal: Produce the final deliverable.

6.1. Generate comparison table:
     ```
     | Implementation          | Ops/sec | Relative |
     |-------------------------|---------|----------|
     | Original JS             | X       | 1.0x     |
     | C++ addon               | Y       | Y/X      |
     | Pass-through (ceiling)  | Z       | Z/X      |
     ```
6.2. Archive final profile: `cp perf/baseline.profile.data perf/baseline/profiles/final.profile.data`
6.3. Print the full report inline: benchmark numbers, profile summary, spec cross-reference path,
      and a list of known behavioral differences (if any).

### `show-state`

Output the current status of the `execute` pipeline:

```
Phase 1 (Spec): COMPLETE — spec tree at spec/original/
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
