---
name: asm-optimizer
description: Evaluate and optimize hot functions through assembly translation — perf-based baseline profiling, microbenchmark validation, and iterative improvement
---

# Skill: asm-optimizer

## Persona

Senior performance engineer with deep expertise in x86 assembly optimization, microarchitecture analysis (frontend/backend bound, cache hierarchy, branch prediction, load/store queues), and SIMD kernel optimization.

## On Activation

1. Present a sorted list of hot functions ranked by optimization potential (from profiling data)
2. Check for existing baseline profiles in `perf/baseline/profiles/`
3. Check for existing ASM reference implementations
4. Show available commands

## Dependencies

- `.profiler/perf_archives/` — previous profiling data
- `perf/baseline/` — baseline build and profiles (generated, gitignored)
- `@opensassi/opencode` package — all support scripts, artifact pipeline, and installers
  Run via `npx @opensassi/opencode run <path>`
- Reference implementations from external projects as available

## Commands

### `setup-baseline`

Create the baseline directory structure, clone a tagged release of the project, build the Release binary, and run the full profiling matrix using `npx @opensassi/opencode run asm-optimizer/run-baseline.sh`.

Output:
```
perf/baseline/
├── <project>-<version>/       ← release tag checkout
├── profiles/default/
│   ├── preset1-Nfr/
│   ├── preset1-Mfr/
│   ├── preset2-Nfr/
│   └── preset2-Mfr/
└── reports/profile-summary.json
```

### `profile <name> [--config CONFIG] [--frames N]`

Run a maximal perf counter dump against the baseline binary. All counters listed below are recorded. Saves to `perf/baseline/profiles/<name>/`.

Default: `--config default --frames 5`

If `--config current` is used, profiles the **current working tree** binary (not baseline) for comparison.

### `assess <entry>`

Evaluate one function for ASM optimization potential.

Reads from:
- The function's C++ source code
- The baseline profile matching closest config
- Existing reference implementations if available

Reports:
- Current C++ intrinsic implementation
- Perf counter analysis (IPC, cache misses, branch mispredicts)
- Memory vs compute bound classification
- Reference implementation comparison if available
- Estimated speedup potential (Low / Medium / High / Critical)
- Recommendation (port reference, write from scratch, skip)

### `assess-all`

Run assessment on all candidate functions. Produces a ranked priority list sorted by optimization potential score.

### `setup-microbench <entry>`

Create an isolated microbenchmark for one function. Writes a standalone C++ harness that:
- Links against the function's dependencies
- Generates representative random inputs matching production sizes
- Runs N iterations under `perf stat`
- Records cycle count, IPC, cache misses
- Saves baseline to `.profiler/asm-optimizer/baselines/<entry>`

### `spec <entry>`

Generate a technical specification of the C++ reference implementation using the system-design approach:

 1. **Disassemble the C++ SIMD function**: Use `objdump -d` on the compiled binary to extract the C++ compiler's output. Save as `<entry>-cpp-spec.spec.md` in a specs directory.

2. **Count instructions**: Use `grep -c "^    [0-9a-f]"` on the disassembly to get the full instruction count. Break down by functional blocks.

3. **Build a pipeline model**: Identify key µarch features:
   - Frontend (decode width = 4-wide)
   - Execution ports (P0-P6 for Sunny Cove)
   - Memory hierarchy (L1D 48KB, LDQ 12 entries)
   - Cache working set analysis

4. **Create a technical specification** with:
   - Architecture diagram (Mermaid C4 graph of pipeline components)
   - Sequence diagram (instruction flow through pipeline stages)
   - D3 animation for cycle-level visualization
   - Bottleneck analysis table
   - Instruction-to-uop decomposition table

5. **Use the artifact pipeline** to validate extracted diagrams:
   ```
   npx @opensassi/opencode run extract-artifacts.js --file <spec-path>
   npx @opensassi/opencode run test-artifacts.js --file <spec-path>
   ```

6. The spec becomes the **baseline reference** for all subsequent analysis — all ASM implementations are compared against this spec, not against raw intuition.

### `analyze-gap <entry>`

Compare the ASM implementation against the C++ spec baseline:

1. **Disassemble both**:
   ```
   objdump -d <microbench> | awk '/<my_function>/,/^$/' | grep -c "^    [0-9a-f]"
   objdump -d <microbench> | awk '/<DQInternSimd.*>/,/^$/' | grep -c "^    [0-9a-f]"
   ```

2. **Compare instruction count per functional block**: rdCost setup, sigBits, cffBits, spt dispatch, min-select, store/epilogue.

3. **Identify structural differences**:
   - Is the compiler using LEA chains instead of IMUL? (e.g., `ctx*3` then `*8` = ×24)
   - Are memory-folded vpinsrd/vpinsrq used instead of separate `mov`+`vpinsrd`?
   - Is register scheduling different (pop interleaved with vector compute)?
   - Are address computations precomputed or re-computed per load?

4. **Rate each gap** on potential impact:
   - **Critical**: 5+ uops saved, 3+ cycles
   - **High**: 3-5 uops saved, 1-3 cycles
   - **Medium**: 1-3 uops saved, <1 cycle
   - **Low**: cosmetic only

5. **Output** a structured gap analysis: for each gap, the C++ approach, our ASM approach, the estimated uop/cycle difference, and a fix recommendation.

### `bench <entry>`

Run the microbenchmark and compare against the C++ SIMD baseline:

1. Build the microbenchmark with `-fno-inline` to prevent the C++ function from being inlined into the benchmark loop.
2. Call both functions through **volatile function pointers** to force indirect calls (no inlining advantage).
3. Record:
   - C++ SIMD ref time
   - ASM time
   - Speedup ratio (ASM / C++ = 1.0 means equal)
4. Report whether the result is above the significance threshold (see Benchmark Environment notes).

### `implement <entry> [--ref asm-path]`

Generate an implementation for one function, following the spec-first process:

1. **Generate spec first**: If no spec exists for this entry (from `spec <entry>`), tell the user to run `spec <entry>` first and abort.
2. **Analyze the gap**: If no gap analysis exists, run `analyze-gap <entry>` to identify which structural improvements to target.
3. **Propose a hypothesis**: For each identified gap, propose a specific ASM change. Create a mini-spec for the hypothesis explaining what it changes and why.
4. **Write the ASM**: Write a NASM `.asm` file in the project's ASM source directory. Only use GAS inline asm in `.cpp` if NASM is unavailable. **NASM caveat**: All YMM instructions using ymm0–ymm7 require `{vex3}` prefix — without it, NASM silently emits VEX 2-byte (128-bit) encoding, zeroing the upper 128 bits. Verify with `objdump -d` (look for `c4` prefix = 256-bit, `c5` = 128-bit).
5. **Register**: Add the `extern "C"` declaration in the ASM header and the function pointer assignment in the registration function.
6. **Validate**: Run bit-exact test (all test patterns must pass).
7. **Benchmark**: Run `bench <entry>` against the C++ SIMD baseline.
8. **Evaluate**: If the improvement is above the significance threshold, accept. If below, archive as experiment.

### `iterative-optimize <entry> [--iter N]`

Full optimization pipeline with experiment archiving:

1. `setup-microbench <entry>` — create/update harness
2. `spec <entry>` — generate C++ technical specification
3. For each hypothesis (up to N iterations):
   a. `analyze-gap <entry>` — compare to C++ baseline
   b. `implement <entry>` — try one improvement
   c. `bench <entry>` — measure against C++ SIMD
   d. If speedup >= threshold: accept, commit, continue
   e. If speedup < threshold: archive experiment

4. **If after N iterations no hypothesis achieves significant improvement**:
   - Run `archive-experiment <entry>` with the final results
   - Only the experiment files are committed (not the code changes)
   - Working tree changes remain uncommitted for other agents

5. Report final outcome: which improvements succeeded, which were archived, and the per-hypothesis benchmark table.

### `archive-experiment <entry>`

Save a complete experiment record when a hypothesis does not yield significant improvement:

1. Create `perf/experiments/<entry>_<date>/` with:
   - `src/` — microbenchmark, ASM source, build script
   - `specs/` — technical specifications generated during analysis
   - `results/` — benchmark data, perf stat output, comparison tables
   - `README.md` — session summary, hypothesis tried, benchmark results, conclusions

2. Stage only the experiment directory: `git add perf/experiments/<entry>_<date>/`
3. Do NOT revert other working tree changes.
4. Report the experiment path and a summary.

### `report [--format markdown|json]`

Generate an optimization report covering all assessed/optimized entries with measured speedups and recommendations.

## Assessment Methodology

Each dispatch table entry is scored against these factors:

| Factor | Source | Weight |
|--------|--------|--------|
| Perf share (% samples) | Baseline profile flamegraph | Primary sort key |
| IPC of current impl | `perf stat` on microbench | < 1.5 = high potential |
| LLC cache miss rate | `perf stat LLC-load-misses / LLC-loads` | > 5% = high potential |
| Branch mispredict rate | `perf stat branch-misses / branches` | > 2% = high potential |
| Frontend bound % | `perf stat --topdown` | > 15% = can improve |
| Composable pipeline | Manual analysis of data flow | Multiple ops fuse-able? |
| Compiler gap | Instruction count diff from C++ baseline | > 20% more instr = high potential |
| External ASM reference | Reference implementation tree | Direct port possible? |
| Register pressure | Manual analysis of Temps | Spills reduce gain |
| Data width utilization | AVX2 vs current vectorization | Partial lane usage? |

Score → **Low / Medium / High / Critical**

### Benchmark Environment

| Factor | Workstation | Laptop |
|--------|------------|--------|
| Turbo boost | Disable for reproducibility | Keep enabled (no control) |
| Significance threshold | ~5% speedup | ~15-20% speedup |
| Runs per measurement | 3-5 | 5-10 |
| Suggested approach | microbench + full encoder | microbench-only (encoder noise too high) |

On a laptop, **microbenchmark-only measurements** are recommended. Full encoder
wall-clock comparisons are high-noise and should not be used to determine significance.
The significance threshold should account for:
- CPU frequency scaling (turbo boost, thermal throttling)
- Background processes (GUI, browser, etc.)
- Shared memory bandwidth with integrated GPU
- `taskset -c N` should be used for all measurements

### Experiment Archiving

When an optimization hypothesis does not achieve the significance threshold:

1. The experiment is saved to `perf/experiments/<entry>_<date>/`
2. All artifacts (ASM source, benchmark data, pipeline specs) are included
3. The experiment directory is `git add`-ed but NOT committed (session workflow handles commit)
4. The working tree changes (ASM code, registration changes) are **preserved** — not reverted
5. This ensures the session's work is archived even when it doesn't produce a winning optimization

## Baseline Profile Counter Set

Maximal capture — we don't filter yet, we capture everything:

```
cycles,instructions,branches,branch-misses,
cache-references,cache-misses,
L1-dcache-loads,L1-dcache-load-misses,L1-dcache-stores,
L1-icache-loads,L1-icache-load-misses,
LLC-loads,LLC-load-misses,LLC-stores,LLC-store-misses,
dTLB-loads,dTLB-load-misses,dTLB-stores,dTLB-store-misses,
iTLB-loads,iTLB-load-misses,
node-loads,node-load-misses,node-stores,node-store-misses,
alignment-faults,
context-switches,cpu-migrations,page-faults,
stalled-cycles-frontend,stalled-cycles-backend,
fp_arith_inst_retired.256b_packed_single,
fp_arith_inst_retired.128b_packed_single,
fp_arith_inst_retired.scalar_single,
mem_load_uops_retired.l1_hit,mem_load_uops_retired.l1_miss,
mem_load_uops_retired.l2_hit,mem_load_uops_retired.l2_miss,
mem_load_uops_retired.llc_hit,mem_load_uops_retired.llc_miss
```

## Design Principles

- **Spec first, then implement** — Every optimization starts by generating a technical specification of the C++ compiler's output. The compiler is the reference, not our intuition. Compare against its instructions, its scheduling, its port utilization.

- **Measure against C++ baseline, not against previous ASM** — The C++ SIMD reference is the true baseline. If our ASM is slower than the compiler's output, we need to understand why. If it's equal or faster, we've succeeded. Never benchmark ASM vs old-ASM — that hides regressions against the compiler.

- **Every hypothesis is an experiment** — Before writing ASM, write a mini-spec for the hypothesis: what structural change is proposed, why it should be faster, which µarch bottleneck it addresses, and the expected instruction/cycle savings.

- **Benchmark with `-fno-inline` and volatile function pointers** — The C++ function is `static` in a header and will be inlined into the benchmark harness unless explicitly prevented. Use `-fno-inline` for the microbenchmark compilation and call both C++ and ASM through volatile function pointers to force indirect calls and ensure fair comparison.

- **Document negative results** — When a hypothesis fails to improve performance, save the experiment to `perf/experiments/`. The experiment directory records what was tried, the benchmark data, and the analysis. Negative results are as valuable as positive ones — they prevent future wasted effort.

- **Significance depends on environment** — On a workstation with turbo disabled: ~5% threshold. On a laptop with uncontrolled turbo/noise: ~15-20% threshold. Always state the threshold and the number of runs used.

- **Microbenchmarks isolate the function from the full encode pipeline** — The compiler's function pointer dispatch hides improvements smaller than ~5% of the function's time. Full encoder wall-clock comparisons are even noisier.

- **Validate bit-exactness** — ASM output must match C++ SIMD output exactly for all test patterns. Bit-exactness is non-negotiable.

- **External references are reference, not template** — Adapt algorithms to your data structures rather than blindly copying reference patterns.

- **Results persist in `.profiler/asm-optimizer/` and `perf/experiments/`**

- **NASM naming convention**: `<project>_<operation>_<size>_<isa>.asm`

- **Registration** via the project's ASM registration function
