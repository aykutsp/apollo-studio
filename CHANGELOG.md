# Changelog

All notable changes to Apollo Studio are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Until the 1.0 release, minor versions may contain breaking changes — this
is flagged explicitly in the notes below.

## [Unreleased]

### Added
- Wall cutouts for hosted openings. Walls are now rendered as segments
  (pillars, lintels, window sills) so doors and windows show through a
  real gap instead of being occluded by the wall box.
- **X-ray walls** toggle in 3D — walls facing away from the interior fade
  out automatically, so you can look into a room without orbiting.
- Optional roof / ceiling toggle in 3D.
- Wall color property, editable from the Inspector with a native color
  picker and a hex text input.
- Panel hide/show with `[` and `]` shortcuts, plus an **auto-open
  Inspector** option that opens the right panel when a selection appears.
- Samples menu in the top bar with three bundled projects: *Atelier Loft*,
  *Urban Apartment*, *Studio Office*.
- Procedural furniture dispatcher covering ~40 kinds: seating, tables,
  beds, kitchen base/wall/tall cabinets, appliances (fridge, stove,
  microwave, dishwasher, range hood, washing machine), bathroom fixtures
  (basin, bathtub, shower, toilet), lighting (floor, table, pendant),
  decor (plants, rugs, TV, monitor, parasol, BBQ grill).
- Kitchen casework with `mountHeight` metadata so wall cabinets land at
  1.4 m and base cabinets on the floor automatically.
- Draw **room** tool — drag a rectangle to commit four walls at once.
- **Measure** tool with click-to-start/end and committed dimension labels.
- Smart snap in the 2D plan: snap to wall endpoints within a screen-space
  radius, snap to grid, orthogonal suggestion (hold Shift to break).
- Live wall dimensions in 2D — length labels on each wall segment.
- ACES filmic tone mapping, contact shadows, three-point lighting and
  `drei` `Environment` (apartment preset) in the 3D viewport.
- Design token system in OKLCH (`packages/design-tokens/src/editor-theme.css`)
  covering colors, spacing, radii, type, elevation, motion, z-index.
- Inline SVG icon set, replacing character glyphs.
- Inspector position fields for X, Y, and Z (Y enables
  multi-axis placement, needed by kitchen wall cabinets).
- Runtime component catalog loader merging `public/catalogs/apollo-core.json`
  with the built-in catalog.
- Documentation: `docs/pascal-parity.md` (gap analysis vs Pascal Editor)
  and `CLAUDE.md` (project memory).
- `SECURITY.md`, updated `CONTRIBUTING.md`, dual licensing in
  `LICENSE` + `COMMERCIAL-LICENSE.md`, refreshed `NOTICE.md`.

### Changed
- App shell rewritten around a 44 px rail + 280 px side panel + stage +
  300 px inspector + 28 px status bar. Previous Pascal-lite layout
  retired.
- 2D plan canvas redrawn with pan/zoom via SVG `viewBox`, dark grid,
  origin axes, dimension chips.
- 3D scene factored into `WallWithOpenings`, `WallSegmentMesh`,
  `OpeningPanel`, `ObjectMesh`, and a `ProceduralFurniture` dispatcher.
- Component catalog JSON schema extended with `procedural` recipes and
  optional `mountHeight`.
- Asset thumbnails drawn as side/front elevations for each procedural
  kind, replacing colored-block placeholders.

### Removed
- Old runtime catalogs (`core-interiors.json`, `architectural-openings.json`)
  — replaced by a single `apollo-core.json` that mirrors the built-in.
- Old sample JSON files (`atelier-house`, `retail-pavilion`, `urban-loft`)
  — replaced by the three new bundled samples.

### Licensing
- Project relicensed from **MIT** to **GNU AGPL-3.0-or-later** with a
  separate commercial license option. See `LICENSE`, `COMMERCIAL-LICENSE.md`,
  and `NOTICE.md`. Existing installations under MIT may continue under
  MIT for commits dated prior to this entry; any commit from this entry
  forward is AGPL or commercial.

## [0.1.0] — 2026

Initial public alpha. Browser-based spatial editor with live 2D and live
3D viewports, wall/room drawing, hosted openings, a parametric catalog,
command-based undo/redo, and deterministic project JSON.
