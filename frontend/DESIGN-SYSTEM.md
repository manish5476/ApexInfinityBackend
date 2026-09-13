# Design system

Runtime visual values live in `theme/tokens/` and semantic light/dark values live in `theme/themes/`. Components consume semantic CSS custom properties only. Hex colors are permitted solely inside theme definitions.

Use spacing, radius, elevation, motion, control-size, layout, and typography tokens. Prefer flexible layouts and `clamp()` layout tokens; do not introduce feature-local color palettes, arbitrary spacing, or fixed desktop widths.
