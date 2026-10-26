Validate the complete input before the zero-vector shortcut.
---
Scale each vector independently by its largest absolute component before computing its norm.
---
Use math.fsum for accumulation, normalize both vectors, then clamp rounding drift.
