<div align="center">

# Apollo Studio

**Browser-first architectural editor — live 2D drafting, live 3D walkthrough, procedural parts library.**

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-c29a4a?style=flat-square)](./LICENSE)
[![Commercial License](https://img.shields.io/badge/commercial-dual_license-1a1d22?style=flat-square)](./COMMERCIAL-LICENSE.md)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![React](https://img.shields.io/badge/react-19-61dafb?style=flat-square&logo=react&logoColor=1a1d22)](https://react.dev)
[![Three.js](https://img.shields.io/badge/three.js-r184-1a1d22?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org)
[![Vite](https://img.shields.io/badge/vite-7-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-3fb27f?style=flat-square)](./CONTRIBUTING.md)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-d99b4b?style=flat-square)](#status)

![Apollo Studio editor — Atelier Loft sample in split view](./docs/assets/screenshots/hero.png)

</div>

---

## What this is

Classic floor-plan tools are web pages. Professional CAD is a local install. Apollo Studio sits in between: a real editor that runs in the browser, keeps your work in a plain JSON scene graph, and gives you both a **live 2D plan** and a **live 3D walkthrough** of the same model without any export step.

- Draw walls and rooms in 2D with smart snap, orthogonal guides, and live dimensions.
- See the scene grow in 3D while you draw. Walls fade out when the camera is on the outside so you can look *inside* the room — the same trick game engines use for cutaways.
- Drop parametric pieces from a built-in library: seating, tables, beds, kitchen base and wall cabinets, appliances, bathroom fixtures, lighting, decor.
- Inspect every value — position, rotation, scale, material. Undo, redo, duplicate, delete. Save and open plain JSON.

## Live demo

- **Editor:** `https://OWNER.github.io/Apollo---2D-3D-Architectural-Studio/` — replace `OWNER` with your GitHub username after enabling Pages.
- **Samples shipped in the top bar:** *Atelier Loft*, *Urban Apartment*, *Studio Office*.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production bundle to ./dist
npm run preview   # serve the production bundle locally
```

## Feature matrix

| Area            | Capability                                                   | Status   |
|-----------------|--------------------------------------------------------------|----------|
| Drafting        | Draw wall · draw room · measure · smart snap · ortho guides  | Ready    |
| Placement       | Parametric catalog · hosted doors/windows · drag-to-move     | Ready    |
| 2D view         | SVG canvas · zoom/pan · live dimensions · dimension labels   | Ready    |
| 3D view         | ACES tone mapping · shadows · x-ray walls · optional roof    | Ready    |
| Selection       | Click · drag · auto-opening inspector · keyboard delete      | Ready    |
| Inspector       | Position (X/Y/Z) · rotation · footprint · height · material  | Ready    |
| Undo/Redo       | Command history — every edit reversible                      | Ready    |
| Project I/O     | Deterministic JSON · schema-versioned                         | Ready    |
| Catalog I/O     | Runtime-loaded catalogs · user-importable JSON               | Ready    |
| Panels          | Collapse/show · auto-open inspector · `[` `]` shortcuts      | Ready    |
| Samples         | Three sample projects, loaded from the top bar menu          | Ready    |
| AR/XR           | WebXR room-scale anchors on the shared scene graph           | Planned  |
| Multi-level     | Floors and levels                                            | Planned  |
| Cabinetry suite | Parametric kitchen runs with automatic fill                  | Planned  |

## Architecture

```text
apollo-studio/
├── apps/
│   └── web-editor/               Vite + React 19 editor shell
│       ├── src/
│       │   ├── App.tsx            Top-level layout and state wiring
│       │   ├── components/        Panels, toolbars, icons, inspector
│       │   ├── three/             Procedural 3D furniture renderers
│       │   └── utils/             Project + catalog IO
│       └── index.html
├── packages/
│   ├── core-domain/              Entity types · geometry · built-in catalog
│   ├── editor-state/             Tools · commands · history · drafts
│   ├── command-system/           EditorCommand interface · snapshot impl
│   └── design-tokens/            OKLCH palette + semantic tokens
├── public/
│   ├── catalogs/                 Runtime-loadable catalogs (JSON)
│   └── samples/                  Shipped sample projects (JSON)
└── docs/                         Architecture, roadmap, asset notes
```

### Data model, in one breath

- A **scene** is `{ id, name, unitSystem, entities[] }`.
- An **entity** is a `wall`, `object`, `door`, or `window`.
- A **door** or **window** is hosted on a wall: `hostWallId`, `offsetAlongWall`, `width`, `height`, `sillHeight`.
- An **object** carries a `procedural` recipe `{ kind, palette }` so the 3D renderer knows how to build it from primitives.
- A **component** in the catalog is an authoring-time definition with `footprint`, `height`, optional `mountHeight` (for wall-hung casework), and an optional `procedural` recipe.

### Render pipeline

- **2D**: SVG with `viewBox`-based pan/zoom, grid snap at 0.5 m (0.1 m fine), snap to wall endpoints within screen-space radius, orthogonal suggestion (hold <kbd>Shift</kbd> to break), live dimensions on walls and preview strokes.
- **3D**: `@react-three/fiber` canvas with ACES filmic tone mapping, sRGB output color space, drei `Environment` (apartment preset), three-point lighting, contact shadows, and an infinite grid. Objects are built from primitives by the `ProceduralFurniture` dispatcher — sofas, chairs, tables, cabinets, appliances, lighting and more, each keyed by `kind` and tinted via the component palette. Walls fade out automatically when the camera is on the exterior side so you can look into the room (toggle *X-ray walls*).

## Keyboard

| Shortcut         | Action                                |
|------------------|---------------------------------------|
| <kbd>V</kbd>     | Select tool                           |
| <kbd>H</kbd>     | Pan tool                              |
| <kbd>W</kbd>     | Draw wall                             |
| <kbd>R</kbd>     | Draw room (drag a rectangle)          |
| <kbd>P</kbd>     | Place selected component              |
| <kbd>M</kbd>     | Measure                               |
| <kbd>Esc</kbd>   | Cancel tool / clear selection         |
| <kbd>Del</kbd>   | Delete selection                      |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd>     | Undo                   |
| <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> | Redo |
| <kbd>[</kbd>     | Toggle left panel                     |
| <kbd>]</kbd>     | Toggle Inspector                      |

## Catalog authoring

A catalog is a plain JSON array of `ComponentDefinition`. Import one at runtime through the **Catalog** button in the top bar; it merges with the built-in library without overriding it. See [`packages/core-domain/src/component-catalog.json`](./packages/core-domain/src/component-catalog.json) for the shipped reference.

Minimum definition:

```json
{
  "catalogId": "studio-furniture",
  "catalogLabel": "Studio Furniture",
  "key": "chair-lounge-modern",
  "name": "Modern Lounge Chair",
  "category": "Armchair",
  "family": "furniture",
  "placementMode": "free",
  "material": "Leather",
  "footprint": { "x": 0.9, "y": 0.88 },
  "height": 0.92,
  "procedural": {
    "kind": "armchair",
    "palette": { "primary": "#6b4a34", "frame": "#241812", "accent": "#b58a64" }
  }
}
```

Set `"placementMode": "hosted-wall"` for doors and windows; the editor will refuse to drop them in open space and snap them to wall offsets instead.

## License

Apollo Studio is dual-licensed:

- **Open-source:** [AGPL-3.0-or-later](./LICENSE). If you fork or host a modified version, you are obligated to publish your source under the same terms, including over a network.
- **Commercial:** a separate license is available when AGPL obligations do not fit — closed-source products, OEM embedding, managed SaaS, or enterprise deployments without source disclosure. See [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md).

Third-party attributions and exceptions live in [NOTICE.md](./NOTICE.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). TL;DR: run `npm run dev`, open an issue before large refactors, keep PRs focused, follow the existing code style (no formatter scripts yet — match what's around you). For security disclosures read [SECURITY.md](./SECURITY.md).

## Acknowledgments

- Editor idioms draw from SketchUp, [Arcada](https://github.com/mehanix/arcada), [Pascal Editor](https://github.com/pascalorg/editor), Live Home 3D, and floor-plan.ai.
- Rendering stands on [three.js](https://threejs.org), [react-three-fiber](https://docs.pmnd.rs/react-three-fiber), and [@react-three/drei](https://github.com/pmndrs/drei).
- Typography uses [Inter](https://rsms.me/inter/).
- The procedural furniture library is original and released under the project license — no assets downloaded from third-party marketplaces.

## Status

Apollo Studio is in **alpha**. APIs, file formats, and the procedural recipe schema may change before 1.0. Pin to a specific commit for anything you need to be stable, and open an issue before building integrations you cannot easily revise.
