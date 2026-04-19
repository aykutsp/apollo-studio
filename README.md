<div align="center">

<img src="./favicon.svg" width="64" height="64" alt="Apollo Studio" />

# Apollo Studio

### Browser-first 2D/3D Architectural Editor

Draw floor plans in 2D. Walk through them in 3D. No install, no export step — just open the browser and start designing.

<br/>

[![Live Demo](https://img.shields.io/badge/▶%20Live%20Demo-aykutsp.github.io-d99b4b?style=for-the-badge)](https://aykutsp.github.io/Apollo---2D-3D-Architectural-Studio/)

<br/>

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-c29a4a?style=flat-square)](./LICENSE)
[![Commercial License](https://img.shields.io/badge/Commercial-Dual%20License-1a1d22?style=flat-square)](./COMMERCIAL-LICENSE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=1a1d22)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r184-1a1d22?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-d99b4b?style=flat-square)](#status)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-3fb27f?style=flat-square)](./CONTRIBUTING.md)

</div>

---

## Overview

Apollo Studio is a real architectural editor that runs entirely in the browser. It bridges the gap between simple floor-plan web apps and heavyweight desktop CAD — giving you precision 2D drafting and a live 3D walkthrough of the same model, simultaneously, with no plugins or exports required.

Your project is stored as plain JSON, fully portable and version-control friendly.

---

## Features

**2D Drafting**
- Draw walls and rooms with smart grid snap and orthogonal guides
- Live dimension labels update as you draw
- Snap to wall endpoints, grid intersections, and midpoints
- Measure tool with click-to-place dimension markers

**3D Viewport**
- Real-time 3D preview synchronized with the 2D plan
- ACES filmic tone mapping, contact shadows, three-point lighting
- X-ray walls — walls between the camera and the room interior fade out automatically so you can always see inside
- Optional high-quality render mode with ambient occlusion and bloom
- Orbit, pan, and zoom with standard mouse controls

**Object Library**
- 50+ parametric furniture and fixture kinds: seating, tables, beds, kitchen cabinets, appliances, bathroom fixtures, lighting, decor
- Kitchen casework with automatic base / wall / tall cabinet height placement
- Hosted doors and windows that snap to walls with real cutout gaps
- Import external GLTF/GLB models from a URL

**Editor**
- Command palette (`Ctrl+K`) — search and run any action by name
- Full undo / redo on every edit
- Inspector panel with position, rotation, scale, and material controls
- Right-click context menu on any object or wall
- Scene tree panel for navigating all entities
- Export scene as GLB, OBJ, or STL
- Autosave to IndexedDB — your work survives a tab crash
- Save and open plain JSON project files

---

## Screenshots

> Sample projects are bundled and loadable from the top bar — try **Atelier Loft**, **Urban Apartment**, or **Studio Office**.

| 2D Plan | 3D Walkthrough | Split View |
|---------|---------------|------------|
| ![2D plan view](https://placehold.co/380x220/1a1d22/c29a4a?text=2D+Plan) | ![3D viewport](https://placehold.co/380x220/1a1d22/c29a4a?text=3D+View) | ![Split view](https://placehold.co/380x220/1a1d22/c29a4a?text=Split+View) |

---

## Getting Started

```bash
git clone https://github.com/aykutsp/Apollo---2D-3D-Architectural-Studio.git
cd Apollo---2D-3D-Architectural-Studio
npm install
npm run dev        # → http://localhost:5173
```

```bash
npm run build      # type-check + production bundle → ./dist
npm run preview    # serve the production bundle locally
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Pan tool |
| `W` | Draw wall |
| `R` | Draw room (rectangle) |
| `P` | Place selected component |
| `M` | Measure |
| `Ctrl+K` | Command palette |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `[` | Toggle left panel |
| `]` | Toggle inspector |
| `Esc` | Cancel / clear selection |
| `Del` | Delete selection |

---

## Feature Matrix

| Area | Capability | Status |
|------|-----------|--------|
| Drafting | Wall · room · measure · snap · ortho guides | ✅ Ready |
| Placement | Parametric catalog · hosted openings · drag-to-move | ✅ Ready |
| 2D View | SVG canvas · zoom/pan · live dimensions | ✅ Ready |
| 3D View | ACES · shadows · x-ray walls · HQ render toggle | ✅ Ready |
| Selection | Click · drag · auto-inspector · keyboard delete | ✅ Ready |
| Inspector | Position · rotation · footprint · height · material | ✅ Ready |
| Undo / Redo | Command history — every edit reversible | ✅ Ready |
| Command Palette | `Ctrl+K` search across all actions | ✅ Ready |
| Context Menu | Right-click on objects and walls | ✅ Ready |
| Export | GLB · OBJ · STL scene export | ✅ Ready |
| Autosave | IndexedDB background save + session restore | ✅ Ready |
| Project I/O | Deterministic JSON · schema-versioned | ✅ Ready |
| Catalog I/O | Runtime-loaded catalogs · user-importable JSON | ✅ Ready |
| AR / XR | WebXR room-scale on the shared scene graph | 🔜 Planned |
| Multi-level | Floors and levels | 🔜 Planned |
| Cabinetry suite | Parametric kitchen runs with auto-fill | 🔜 Planned |

---

## Project Structure

```
apollo-studio/
├── apps/
│   └── web-editor/          Vite + React 19 app shell
│       └── src/
│           ├── App.tsx       Layout and state wiring
│           ├── components/   Panels, toolbars, inspector
│           ├── three/        Procedural 3D renderers
│           └── utils/        Project and catalog I/O
├── packages/
│   ├── core-domain/         Entity types, geometry, catalog
│   ├── editor-state/        Tools, commands, history
│   ├── command-system/      EditorCommand interface
│   └── design-tokens/       OKLCH palette + CSS variables
├── public/
│   ├── catalogs/            Runtime catalog JSON
│   └── samples/             Bundled sample projects
└── schemas/                 JSON schema + OpenAPI spec
```

---

## Catalog Authoring

Catalogs are plain JSON arrays of `ComponentDefinition`. Import one at runtime via the **Catalog** button in the top bar — it merges with the built-in library without replacing it.

```json
{
  "catalogId": "my-furniture",
  "catalogLabel": "My Furniture",
  "key": "lounge-chair-01",
  "name": "Lounge Chair",
  "category": "Armchair",
  "family": "furniture",
  "placementMode": "free",
  "footprint": { "x": 0.9, "y": 0.88 },
  "height": 0.92,
  "procedural": {
    "kind": "armchair",
    "palette": { "primary": "#6b4a34", "frame": "#241812", "accent": "#b58a64" }
  }
}
```

Use `"placementMode": "hosted-wall"` for doors and windows — the editor will snap them to wall offsets and refuse placement in open space.

---

## License

Apollo Studio is dual-licensed:

- **Open-source** — [AGPL-3.0-or-later](./LICENSE). Forks and hosted modifications must publish source under the same terms.
- **Commercial** — a separate license is available for closed-source products, OEM embedding, managed SaaS, or enterprise deployments. See [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md).

Third-party attributions live in [NOTICE.md](./NOTICE.md).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Open an issue before large refactors, keep PRs focused, and match the existing code style. For security disclosures see [SECURITY.md](./SECURITY.md).

---

## Acknowledgments

Rendering built on [Three.js](https://threejs.org), [react-three-fiber](https://docs.pmnd.rs/react-three-fiber), and [@react-three/drei](https://github.com/pmndrs/drei). Typography uses [Inter](https://rsms.me/inter/). Editor interaction patterns draw from SketchUp, Live Home 3D, and floor-plan.ai.

---

## Status

Apollo Studio is in **alpha**. The file format, procedural recipe schema, and component APIs may change before 1.0. Pin to a specific commit for anything you need to stay stable.

<div align="center">

<br/>

[![Live Demo](https://img.shields.io/badge/▶%20Try%20Apollo%20Studio-Live%20Demo-d99b4b?style=for-the-badge)](https://aykutsp.github.io/Apollo---2D-3D-Architectural-Studio/)

</div>
