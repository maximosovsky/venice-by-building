# Performance acceptance follow-up

## Changes in this follow-up
- `web/app.js`: acknowledge the hover state already rendered after GPU picking. Previously a slow readback left the pre-pick visual snapshot, scheduling one redundant 182-draw scene frame seconds later.
- Separate label hysteresis progress from visible label changes. Internal convergence now continues without submitting identical GPU frames. Keep the original label algorithm, fonts, camera and scale/visibility semantics.
- Remove transient `__frameProbe` and diagnostic render traces.
- Guard ground input fingerprints inside cache try/catch. Missing `crypto.subtle` or rejected digest uses exact original polygon/EDGE fallback; unvalidated cache is never accepted.
- `web/render-state.js`: draw the final settled frame on animated -> stationary transition.
- `tests/performance-render.mjs`: RED -> GREEN final-frame regression.
- `tests/performance-cache-browser.mjs`: RED -> GREEN missing/rejected crypto plus stale-config browser fixtures.
- `tests/performance-browser.mjs`: preserve every assertion and wait; explicit report mkdir, case selector, separate Chromium per fixture, progress logs.
- Delete only three untracked orphan meshopt derivatives. Preserve original models and four currently referenced content-addressed assets.

## Actual results
- Four performance unit scripts PASS. Lossless ship decoded parity: 7230676 -> 4367600 bytes; exact original ground attributes, indices and EDGE bytes/min/size PASS.
- Final full `VENICE_URL=http://127.0.0.1:8770 node tests/performance-browser.mjs`: exit 0, `PASS demand GPU, stationary pick, flight, exact original labels, playback, corrupt fallback`.
- Cache browser cases: `PASS guarded ground fallback absent`, `rejected`, `stale`. Missing/rejected crypto previously reproduced fatal startup before fix.
- Readiness: all four held-model scenarios passed (main/splash3, normal/reduced), normal handoff explicitly cancelled by Escape; two honest HTTP503 failure cases PASS. Combined full readiness runs sometimes timed out; all six cases have successful actual runs, not relaxed assertions.
- Placement fresh/legacy, actual drag/wheel rotation/versioned persistence/reload: PASS.
- Offscreen GPU: `{ geometries: 53, meshes: 53, restored: true }`, PASS.
- Route preload: PASS hidden complete geometry, instant visibility, no refetch/card replacement.
- `git diff --check`: exit 0 (existing CRLF normalization notices only).

## Final scratch probe
`acceptance-guard-final.json` under Hermes scratch `venice-performance/`:
- ready 7826.1 ms; 3 real ships, GPU prepared and rendered, visible scene.
- idle draws/picks 0/0; stationary hover draws/picks 0/0.
- transfer 19759158 bytes; decoded 25878835 bytes.
- 34 long tasks, total 5130 ms, largest 699 ms; zero page errors/request failures.
- screenshot `acceptance-guard-final-main.png`.

## Comparable local baseline and limits
Baseline serves original performance-owned files from bccbbaa88898e0a8eb989f6b47c3674fb7843282, with identical current data/other assets, localhost HTTP and SwiftShader; report `local-baseline.json`.
- baseline transfer 20081152 bytes; final optimized transfer 19759158 bytes: only about 1.60% lower. Ground cache adds 2528116 bytes while all three source ground binaries (925544 bytes including resource overhead) still download for fingerprint validation. This cancels most ship transfer savings.
- Baseline readiness 4392.2 ms versus optimized samples 5802 and 7826.1 ms: **no verified startup-time improvement**; variable CPU/software-GPU execution, one sample each, not production evidence.
- Baseline idle 910 draws, stationary hover 1100 draws/2 picks; optimized measured 0/0. Demand GPU savings are verified.
- Content-addressed immutable caching remains only three GLBs and ground. Mutable JS/fonts/artwork were not broadened to immutable caching.
- Software-GPU runs exhibited intermittent startup/screenshot timeouts and one idle-final-frame timing failure; final full performance-browser run passed unchanged assertions. No test timing or assertion relaxation.
- Missing optional suburbs files return existing 404s; startup catches these. No data modifications by this worker.
- Parent additionally verified natural normal-motion intro completion without cancellation on `/` and `/splash3.html`: reveal completed, normal RAF clock restored, engraving/splash removed, labels visible, all three ships ready, no page errors. Separate Chromium runs were used after a second-page SwiftShader startup timeout.
- No commit, push or deployment. Global Hermes/profile files unchanged; no skill writes.
