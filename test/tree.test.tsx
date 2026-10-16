import { scrollCalls } from "./setup";

import assert from "node:assert/strict";
import test from "node:test";

import React, { useCallback, useRef, useState } from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";

import VirtualizedTree from "../vanilla/VirtualizedTree";

type Node = { id: string; name: string; children?: Node[] };

const getItemId = (item: Node) => item.id;
const getItemLabel = (item: Node) => item.name;
const getItemChildren = (item: Node) => item.children;

function makeFlat(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({ id: `n${i}`, name: `node ${i}` }));
}

const nested: Node[] = [
  {
    id: "a",
    name: "a",
    children: [
      { id: "a1", name: "a1" },
      { id: "a2", name: "a2", children: [{ id: "a2x", name: "a2x" }] },
    ],
  },
  { id: "b", name: "b" },
];

type HarnessProps = {
  items: Node[];
  selectionMode?: "single" | "multiple";
  initialExpanded?: string[];
  onState?: (state: { expanded: string[]; selected: string[] }) => void;
  hoverExpand?: boolean;
  expandOnSelect?: boolean;
};

function Harness({ items, selectionMode, initialExpanded = [], onState, hoverExpand, expandOnSelect }: HarnessProps) {
  const [expanded, setExpanded] = useState<string[]>(initialExpanded);
  const [selected, setSelected] = useState<string[]>([]);

  const latest = useRef({ expanded: initialExpanded, selected: [] as string[] });

  const handleExpanded = useCallback(
    (ids: string[]) => {
      latest.current = { ...latest.current, expanded: ids };
      setExpanded(ids);
      onState?.(latest.current);
    },
    [onState]
  );

  const handleSelected = useCallback(
    (ids: string[]) => {
      latest.current = { ...latest.current, selected: ids };
      setSelected(ids);
      onState?.(latest.current);
    },
    [onState]
  );

  return (
    <VirtualizedTree
      items={items}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      getItemChildren={getItemChildren}
      itemsExpanded={expanded}
      onExpandedItemsChange={handleExpanded}
      itemsSelected={selected}
      onSelectedItemsChange={handleSelected}
      selectionMode={selectionMode}
      hoverExpand={hoverExpand}
      expandOnSelect={expandOnSelect}
      ariaLabel='test tree'
    />
  );
}

function mount(element: React.ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  let root: Root | undefined;
  act(() => {
    root = createRoot(host);
    root.render(element);
  });
  return {
    host,
    unmount: () => act(() => root?.unmount()),
    tree: () => host.querySelector('[role="tree"]') as HTMLElement,
    rows: () => Array.from(host.querySelectorAll('[role="treeitem"]')) as HTMLElement[],
    labels: () => Array.from(host.querySelectorAll('[role="treeitem"]')).map((r) => r.textContent),
  };
}

function click(element: HTMLElement, init: MouseEventInit = {}) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
  });
}

function hover(element: HTMLElement, from: HTMLElement | null = null) {
  act(() => {
    if (from) {
      from.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: element }));
    } else {
      element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    }
  });
}

function leave(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
  });
}

function press(element: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

test("renders only a window of rows, not the whole list", () => {
  const view = mount(<Harness items={makeFlat(10000)} />);
  const rendered = view.rows().length;
  assert.ok(rendered > 0 && rendered < 60, `expected a small window, got ${rendered}`);
  assert.equal(view.rows()[0].getAttribute("aria-level"), "1");
  view.unmount();
});

test("aria semantics describe the tree", () => {
  const view = mount(<Harness items={nested} initialExpanded={["a"]} />);
  const tree = view.tree();
  assert.equal(tree.getAttribute("aria-label"), "test tree");
  assert.equal(tree.getAttribute("aria-multiselectable"), null);
  assert.equal(tree.getAttribute("tabindex"), "0");

  const rows = view.rows();
  assert.deepEqual(
    rows.map((r) => r.getAttribute("aria-level")),
    ["1", "2", "2", "1"]
  );
  assert.equal(rows[0].getAttribute("aria-expanded"), "true");
  assert.equal(rows[1].getAttribute("aria-expanded"), null);
  assert.equal(rows[2].getAttribute("aria-expanded"), "false");
  view.unmount();
});

test("expanding inserts children in flattened order", () => {
  const view = mount(<Harness items={nested} />);
  assert.deepEqual(view.labels(), ["a", "b"]);

  const toggle = view.rows()[0].firstElementChild as HTMLElement;
  click(toggle);
  assert.deepEqual(view.labels(), ["a", "a1", "a2", "b"]);

  click(view.rows()[2].firstElementChild as HTMLElement);
  assert.deepEqual(view.labels(), ["a", "a1", "a2", "a2x", "b"]);
  view.unmount();
});

test("single selection toggles off when the same row is clicked twice", () => {
  const view = mount(<Harness items={nested} />);
  click(view.rows()[0]);
  assert.equal(view.rows()[0].getAttribute("aria-selected"), "true");
  click(view.rows()[0]);
  assert.equal(view.rows()[0].getAttribute("aria-selected"), "false");
  view.unmount();
});

test("single selection replaces the previous one", () => {
  const view = mount(<Harness items={nested} />);
  click(view.rows()[0]);
  click(view.rows()[1]);
  assert.deepEqual(
    view.rows().map((r) => r.getAttribute("aria-selected")),
    ["false", "true"]
  );
  view.unmount();
});

test("multiple selection supports ctrl toggle and shift range", () => {
  const view = mount(<Harness items={makeFlat(6)} selectionMode='multiple' />);
  assert.equal(view.tree().getAttribute("aria-multiselectable"), "true");

  click(view.rows()[1]);
  click(view.rows()[3], { ctrlKey: true });
  assert.deepEqual(
    view.rows().map((r) => r.getAttribute("aria-selected")),
    ["false", "true", "false", "true", "false", "false"]
  );

  click(view.rows()[0]);
  click(view.rows()[2], { shiftKey: true });
  assert.deepEqual(
    view.rows().map((r) => r.getAttribute("aria-selected")),
    ["true", "true", "true", "false", "false", "false"]
  );
  view.unmount();
});

test("keyboard moves focus and expands or collapses", () => {
  const view = mount(<Harness items={nested} />);
  const tree = view.tree();
  const activeId = () => tree.getAttribute("aria-activedescendant");

  press(tree, "ArrowDown");
  const first = activeId();
  assert.ok(first?.endsWith("-a"), `expected focus on a, got ${first}`);

  press(tree, "ArrowRight");
  assert.deepEqual(view.labels(), ["a", "a1", "a2", "b"]);

  press(tree, "ArrowDown");
  assert.ok(activeId()?.endsWith("-a1"));

  press(tree, "ArrowLeft");
  assert.ok(activeId()?.endsWith("-a"), "collapsed leaf should move focus to the parent");

  press(tree, "ArrowLeft");
  assert.deepEqual(view.labels(), ["a", "b"], "second ArrowLeft collapses the parent");

  press(tree, "End");
  assert.ok(activeId()?.endsWith("-b"));

  press(tree, "Home");
  assert.ok(activeId()?.endsWith("-a"));

  press(tree, "Enter");
  assert.equal(view.rows()[0].getAttribute("aria-selected"), "true");
  view.unmount();
});

test("the focus ring appears only after keyboard interaction", () => {
  const view = mount(<Harness items={nested} />);
  click(view.rows()[0]);
  assert.deepEqual(
    view.rows().map((r) => r.getAttribute("data-tree-focus")),
    [null, null],
    "a mouse click must not draw the ring"
  );

  press(view.tree(), "ArrowDown");
  assert.deepEqual(
    view.rows().map((r) => r.getAttribute("data-tree-focus")),
    [null, "true"],
    "ArrowDown after a click moves the focus to the next row and draws the ring"
  );

  press(view.tree(), "Home");
  assert.deepEqual(
    view.rows().map((r) => r.getAttribute("data-tree-focus")),
    ["true", null]
  );
  view.unmount();
});

test("actions are rendered and do not select the row", () => {
  function WithActions() {
    const [selected, setSelected] = useState<string[]>([]);
    const renderItemActions = useCallback(
      (item: Node) => (
        <button type='button' data-testid={`action-${item.id}`}>
          x
        </button>
      ),
      []
    );
    return (
      <VirtualizedTree
        items={nested}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        getItemChildren={getItemChildren}
        itemsExpanded={[]}
        onExpandedItemsChange={() => {}}
        itemsSelected={selected}
        onSelectedItemsChange={setSelected}
        renderItemActions={renderItemActions}
      />
    );
  }

  const view = mount(<WithActions />);
  const action = view.host.querySelector('[data-testid="action-a"]') as HTMLElement;
  assert.ok(action);
  click(action);
  assert.equal(view.rows()[0].getAttribute("aria-selected"), "false");
  view.unmount();
});

test("scrollToItemId scrolls to the row and reports when it settles", async () => {
  scrollCalls.length = 0;
  let settled = 0;

  function ScrollHarness() {
    const [expanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const onScrollComplete = useCallback(() => {
      settled += 1;
    }, []);

    return (
      <VirtualizedTree
        items={makeFlat(1000)}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        itemsExpanded={expanded}
        onExpandedItemsChange={() => {}}
        itemsSelected={selected}
        onSelectedItemsChange={setSelected}
        scrollToItemId='n500'
        onScrollComplete={onScrollComplete}
        scrollSettleMs={1}
        scrollBehavior='auto'
      />
    );
  }

  const view = mount(<ScrollHarness />);

  assert.deepEqual(scrollCalls, [{ top: 500 * 32, behavior: "auto" }]);

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  assert.equal(settled, 1);

  view.unmount();
});

test("hoverExpand opens on chevron hover only and closes on leaving the subtree", () => {
  const view = mount(<Harness items={nested} hoverExpand />);
  const toggle = () => view.rows()[0].querySelector(".vt-toggle") as HTMLElement;

  hover(view.rows()[0]);
  assert.equal(view.rows().length, 2);

  hover(toggle());
  assert.equal(view.rows().length, 4);

  hover(view.rows()[1], toggle());
  assert.equal(view.rows().length, 4);

  hover(view.rows()[3], view.rows()[1]);
  assert.equal(view.rows().length, 2);
  view.unmount();
});

test("hoverExpand keeps the node open when the chevron is clicked or a child is selected", () => {
  const states: { expanded: string[]; selected: string[] }[] = [];
  const view = mount(<Harness items={nested} hoverExpand onState={(s) => states.push(s)} />);
  const toggle = () => view.rows()[0].querySelector(".vt-toggle") as HTMLElement;

  hover(toggle());
  click(toggle());
  assert.deepEqual(states.at(-1)?.expanded, ["a"]);
  leave(view.tree());
  assert.equal(view.rows().length, 4);
  view.unmount();

  const second = mount(<Harness items={nested} hoverExpand onState={(s) => states.push(s)} />);
  hover(second.rows()[0].querySelector(".vt-toggle") as HTMLElement);
  click(second.rows()[1]);
  assert.ok(states.some((state) => state.expanded.includes("a")));
  leave(second.tree());
  assert.equal(second.rows().length, 4);
  second.unmount();
});

test("hoverExpand does not persist the node when the parent row itself is clicked", () => {
  const states: { expanded: string[]; selected: string[] }[] = [];
  const view = mount(<Harness items={nested} hoverExpand onState={(s) => states.push(s)} />);
  hover(view.rows()[0].querySelector(".vt-toggle") as HTMLElement);
  click(view.rows()[0]);
  assert.deepEqual(states.at(-1)?.selected, ["a"]);
  assert.deepEqual(states.at(-1)?.expanded ?? [], []);
  leave(view.tree());
  assert.equal(view.rows().length, 2);
  view.unmount();
});

test("expandOnSelect expands a collapsed node when it is selected", () => {
  const view = mount(<Harness items={nested} expandOnSelect />);
  click(view.rows()[0]);
  assert.equal(view.rows().length, 4);
  view.unmount();
});

test("hoverExpand: clicking a nested chevron commits the hover-open ancestors too", () => {
  const states: { expanded: string[]; selected: string[] }[] = [];
  const view = mount(<Harness items={nested} hoverExpand onState={(s) => states.push(s)} />);
  const toggleOf = (i: number) => view.rows()[i].querySelector(".vt-toggle") as HTMLElement;

  hover(toggleOf(0));
  hover(view.rows()[2], toggleOf(0));
  hover(toggleOf(2), view.rows()[2]);
  assert.equal(view.rows().length, 5);
  click(toggleOf(2));
  assert.deepEqual(states.at(-1)?.expanded.slice().sort(), ["a", "a2"]);
  leave(view.tree());
  assert.equal(view.rows().length, 5);
  view.unmount();
});

test("expandOnSelect does not expand when the click deselects", () => {
  const view = mount(<Harness items={nested} expandOnSelect />);
  click(view.rows()[0]);
  click(view.rows()[0].querySelector(".vt-toggle") as HTMLElement);
  assert.equal(view.rows().length, 2);
  click(view.rows()[0]);
  assert.equal(view.rows().length, 2);
  view.unmount();
});

test("expandOnSelect leaves an already expanded node expanded", () => {
  const view = mount(<Harness items={nested} expandOnSelect initialExpanded={["a"]} />);
  click(view.rows()[0]);
  assert.equal(view.rows().length, 4);
  view.unmount();
});

test("hoverExpand: clicking row actions in a descendant commits the hover-open ancestors", () => {
  const states: { expanded: string[]; selected: string[] }[] = [];
  const view = mount(
    <VirtualizedTree
      items={nested}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      getItemChildren={getItemChildren}
      itemsExpanded={[]}
      onExpandedItemsChange={(ids) => states.push({ expanded: ids, selected: [] })}
      itemsSelected={[]}
      onSelectedItemsChange={() => {}}
      renderItemActions={(item) => <button className={`act-${item.id}`}>x</button>}
      hoverExpand
    />
  );
  hover(view.rows()[0].querySelector(".vt-toggle") as HTMLElement);
  hover(view.rows()[1], view.rows()[0]);
  click(view.host.querySelector(".act-a1") as HTMLElement);
  assert.deepEqual(states.at(-1)?.expanded, ["a"]);
  view.unmount();
});
