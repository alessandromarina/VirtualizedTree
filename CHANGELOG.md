# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-28

Restructured from a single MUI component into a headless core with interchangeable skins.

### Added

- `core/useVirtualizedTree.ts`: all the behaviour and geometry (flattening, visible window,
  selection, expansion, keyboard navigation, focus tracking, ARIA attributes) with React as its only
  dependency and no styling of any kind.
- Four new skins over that core: `vanilla/` (no dependencies), `tailwind/`, `css-modules/` and
  `styled/`. The MUI version moved to `mui/` and now consumes the same core.
- `selectionMode="multiple"`, with `Ctrl`/`Cmd` to toggle and `Shift` to select a range, by click or
  by keyboard.
- Keyboard navigation and ARIA semantics: `role="tree"` and `role="treeitem"`, `aria-level`,
  `aria-selected`, `aria-expanded`, `aria-multiselectable`, `aria-activedescendant`, arrows, `Home`,
  `End`, `Enter` and `Space`.
- Props for what used to be hard-coded: `itemHeight`, `indentWidth`, `overscan`, `scrollBehavior`,
  `scrollSettleMs`, `ariaLabel`, plus per-skin style escape hatches.
- `renderItemActions`, replacing the `{ type: "spinner" | "button" | "display" }` icon descriptors,
  which were an application concern rather than a tree concern.
- Test suite: 15 tests on `node:test` and jsdom, bundled with esbuild before running so the skins are
  exercised the way a bundler consumes them. Nine cover behaviour on one skin, five are a smoke test
  of every skin asserting zero React warnings, one covers `scrollToItemId`.
- `examples/demo`: Vite application with the five skins side by side on a shared state and a tree of
  about ten thousand nodes, plus `npm run screenshots` to regenerate the images in `docs/`.
- CI on GitHub Actions: formatting, typecheck, tests and demo build.
- MIT license, `CONTRIBUTING.md`, Prettier configuration.

### Changed

- Selection is now `itemsSelected: string[]` and `onSelectedItemsChange`, replacing the single
  `itemSelected: string` and `onItemSelect`. Selection is a set, and single selection is the case
  where that set holds at most one element; the previous behaviour, where clicking the only selected
  row deselects it, is preserved.
- The focus ring is driven by state tracked in the core instead of a `:focus-visible` descendant
  selector, so every skin renders it with a plain condition and the rule is testable.
- `getItemLabel` and `renderItemActions` are no longer dependencies of the flattening pass: they are
  called for visible rows only, so inline lambdas there no longer force a full re-flatten.

## [1.0.0] - 2026-08-21

First version, extracted from a production application: a single `VirtualizedTree.tsx` built on MUI,
with virtualization, expansion, single selection, per-row icons and `scrollToItemId`.
