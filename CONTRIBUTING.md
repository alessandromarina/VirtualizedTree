# Contributing

Pull requests are welcome. The rules below are what CI enforces, so a change that follows them is a
change that merges.

## Before opening a pull request

```shell
npm install
npm run format:check
npm run typecheck
npm test
```

If you touched anything the demo renders, build it too:

```shell
cd examples/demo
npm install
npm run build
```

## What a change is expected to carry

- A test that fails before the change and passes after it. Bug fixes without a reproducing test are
  not merged, because nothing stops the bug from coming back.
- No new runtime dependency. `core/` depends on React and nothing else, and that is the point of it;
  a skin may depend on its own styling library, never on anything more.
- Formatting from `.prettierrc`, not from taste. Run the formatter, do not reformat code you did not
  touch.
- No comments explaining what the code does. If a function needs a comment to be understood, rename
  it or split it. Documentation for users lives in `README.md`.

## Where a change belongs

The split is the whole design, so keep it:

- **`core/useVirtualizedTree.ts`** owns behaviour and geometry: flattening, the visible window,
  selection, expansion, keyboard navigation, focus tracking, ARIA attributes, and the numbers a skin
  needs (`totalHeight`, `offsetY`, `itemHeight`, `row.indentPx`). It returns no style, no class name
  and no markup.
- **A skin** owns markup and appearance, and nothing else. If you find yourself computing an index,
  an offset or an aria attribute inside a skin, that logic belongs in the core.

A behaviour change lands in the core, and every skin inherits it. A skin-only pull request that
reimplements something the core already does will be asked to move it.

## Adding a skin

A new skin needs a reason: a styling technology the existing five do not cover. Another component
kit whose primitives are plain elements is not one, because `vanilla/` already works there with a
find and replace.

If it does need one, a skin is expected to:

- spread `containerProps`, `getRowProps`, `getToggleProps` and `getActionsProps` without rebuilding
  them,
- expose an escape hatch in the idiom of its technology (`className`, `classNames`, `sx`),
- appear in the smoke test list in `test/skins.test.tsx`, which asserts that it mounts, renders,
  selects, collapses and logs zero React warnings,
- appear in the demo in `examples/demo/src/App.tsx` and in the table in `README.md`.

## Changing what the tree looks like

The two images in `docs/` are generated, not drawn. If your change alters the rendering, regenerate
them in the same pull request:

```shell
cd examples/demo
npm run screenshots
```

That script fails if the page logs a single error, so a green run is also a check that the demo works.

## Performance changes

The virtualization is `index * itemHeight` and the flattening is memoized on `items`, `itemsExpanded`,
`getItemId` and `getItemChildren`. A pull request that adds work to either path states what it costs
on a tree of ten thousand nodes, measured, not estimated. Adding a dependency to the flattening memo
is a performance change even when it looks like a refactor: it decides how often the whole expanded
tree is walked again.

## Public API changes

The prop surface is deliberately narrow and controlled: expansion and selection live in the caller's
state, and the tree never owns them. New props need a use case the existing ones cannot serve. Open
an issue first, so the discussion happens before the code.
