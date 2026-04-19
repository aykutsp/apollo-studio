# Contributing to Apollo Studio

Thanks for taking the time. Contributions are welcome as long as they are
focused, discussed up front for anything non-trivial, and licensed under
the same dual-license terms as the rest of the project.

## Ground rules

1. **Open an issue first** for anything larger than a small bug fix or a
   copy change. Apollo Studio is still shaping its public surface area;
   an issue thread saves rework.
2. **One change per pull request.** Rendering tweaks, tool additions, and
   catalog entries are separate PRs, not a single mega-change.
3. **Documentation travels with code.** If you add a tool, add it to the
   README keyboard table. If you add a procedural kind, add a thumbnail
   and a catalog entry.
4. **The dual-license model is non-negotiable.** By opening a PR you
   agree that your contribution is licensed under AGPL-3.0-or-later and
   can be relicensed by the maintainers under the commercial license
   described in [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md).

## Development setup

```bash
git clone <your-fork-url>
cd apollo-studio
npm install
npm run dev        # http://localhost:5173
```

Production verification before every pull request:

```bash
npm run build      # must finish without TypeScript errors
npm run preview    # sanity check the production bundle
```

## Architecture overview

See [`CLAUDE.md`](./CLAUDE.md) for the quick map and [`docs/pascal-parity.md`](./docs/pascal-parity.md)
for the prioritized gap list. Essentials:

- `packages/core-domain/` — entity types, geometry helpers, component catalog. No React, no Three.
- `packages/editor-state/` — tools, commands, history, drafts. Pure functions over `EditorState`.
- `packages/command-system/` — `EditorCommand` interface and the snapshot implementation.
- `apps/web-editor/` — the app shell. React + Three. UI lives under `components/`, 3D under `three/`.
- `packages/design-tokens/` — CSS variables in OKLCH. Never hardcode colors in components.

## Code style

- **TypeScript strict** throughout. No `any` unless you leave a comment that
  explains the foreign type.
- **One responsibility per module.** Don't mix rendering and state in the
  same file.
- **Use design tokens** (`var(--accent)`, `var(--surface-1)`). Adding a new
  semantic token is preferred over reaching for a raw hex.
- **Small files beat clever files.** Split when a single file crosses ~400
  lines and the second half is a distinct concern.
- **Readable over terse.** Name variables for what they are, not how they
  are computed. Constants for anything magical.
- **No emoji in source files or commit messages** unless the user has
  explicitly asked. Keep doc prose matter-of-fact.

## Adding a procedural component

Follow this order — it prevents orphans:

1. `packages/core-domain/src/index.ts` — extend `ProceduralKind`.
2. `apps/web-editor/src/three/ProceduralFurniture.tsx` — add a recipe and
   the dispatcher case.
3. `apps/web-editor/src/components/AssetThumb.tsx` — add a matching thumbnail.
4. `packages/core-domain/src/component-catalog.json` — add catalog entries.
5. `public/catalogs/apollo-core.json` — copy from built-in catalog so the
   runtime loader stays in sync.

Run `npm run build` — the TypeScript compiler catches missing `kind` cases
in the dispatcher switch.

## Commit messages

Use the imperative voice, present tense, one line for the subject.

```
add procedural recipe for wall-hung TV
split wall into segments around hosted openings
inspector: expose wall color
```

Body paragraphs only when the why isn't obvious from the diff.

## Pull request checklist

Before you ask for review:

- [ ] `npm run build` finishes without errors or new warnings.
- [ ] The change is reflected in `README.md` where it belongs (feature matrix, keyboard table, catalog example).
- [ ] `docs/pascal-parity.md` is updated if you closed a gap.
- [ ] No assets were added that you do not have the right to redistribute
      under AGPL-3.0 — see [`NOTICE.md`](./NOTICE.md).
- [ ] Sample projects still load correctly.

## Reporting security issues

Please follow [`SECURITY.md`](./SECURITY.md). Do not file public issues
for suspected vulnerabilities.

## License on contributions

By contributing, you agree that your work is licensed under the
**GNU AGPL v3.0 or later** for the open-source distribution, and may be
relicensed by the project maintainers under the commercial license
described in [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md) without
further notice or compensation. If you are not willing to accept these
terms, please do not open a pull request.
