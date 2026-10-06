# Bundled animations (copy and adapt)

| File | Idea it teaches | Techniques worth reusing | Params |
|---|---|---|---|
| `_plantilla.js` | Template | Particles, mouse attraction, links, fully commented | `count`, `speed` |
| `red-neuronal.js` | How a neural net propagates a signal | Layers/links, pulses with trails, refractory nodes, labels | `layers`, `names`, `outputs` |
| `ordenacion.js` | Bubble sort | Stateful algorithm stepping, tweened bar positions, counters | `count`, `speed` |
| `llm-wiki-compilar.js` | Compile once, query many times | Pure function of time, phases, moving documents, query path | — |
| `llm-wiki-lint.js` | Self-healing knowledge base | Scanner sweep, issue states (detect → fix), tags | — |
| `ww2-bandos.js` | Countries joining sides over time | Slot layout, side switching, timeline bar with events | — |
| `ww2-frente-oriental.js` | A front line advancing and retreating | Self-drawing curve + area, event labels | — |
| `ww2-dday.js` | D-Day landings | Coast geometry, landing waves, parachutes, counter | — |
| `sol-nacimiento.js` | Solar system formation | Pseudo-3D cloud → disk, ignition flash, orbiting planets | — |
| `sol-orbitas.js` | Orbital periods | Real periods, time acceleration, trails, asteroid belt | — |
| `sol-escala.js` | Planet sizes to scale | Camera pan, shaded spheres, rings | — |
| `luna-fases.js` | Moon phases | Terminator drawing, orbit diagram + inset view | — |

All of them are pure functions of time with a fade at the end of the loop and a fixed moment for `api.static`.
