import "./setup";

import assert from "node:assert/strict";
import test from "node:test";

import React, { useCallback, useState } from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";

import CssModulesTree from "../css-modules/VirtualizedTree";
import MuiTree from "../mui/VirtualizedTree";
import StyledTree from "../styled/VirtualizedTree";
import TailwindTree from "../tailwind/VirtualizedTree";
import VanillaTree from "../vanilla/VirtualizedTree";

type Node = { id: string; name: string; children?: Node[] };

const items: Node[] = [
  { id: "a", name: "a", children: [{ id: "a1", name: "a1" }] },
  { id: "b", name: "b" },
];

const getItemId = (item: Node) => item.id;
const getItemLabel = (item: Node) => item.name;
const getItemChildren = (item: Node) => item.children;

type Skin = (props: {
  items: Node[];
  getItemId: (item: Node) => string;
  getItemLabel: (item: Node) => string;
  getItemChildren: (item: Node) => Node[] | undefined;
  itemsExpanded: string[];
  onExpandedItemsChange: (ids: string[]) => void;
  itemsSelected: string[];
  onSelectedItemsChange: (ids: string[]) => void;
  renderItemActions?: (item: Node, itemId: string) => React.ReactNode;
}) => React.ReactNode;

const skins: [string, Skin][] = [
  ["vanilla", VanillaTree],
  ["tailwind", TailwindTree],
  ["css-modules", CssModulesTree],
  ["styled", StyledTree],
  ["mui", MuiTree],
];

function Harness({ Skin: SkinComponent }: { Skin: Skin }) {
  const [expanded, setExpanded] = useState<string[]>(["a"]);
  const [selected, setSelected] = useState<string[]>([]);
  const renderItemActions = useCallback((item: Node) => <button type='button'>{item.id}</button>, []);

  return (
    <SkinComponent
      items={items}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      getItemChildren={getItemChildren}
      itemsExpanded={expanded}
      onExpandedItemsChange={setExpanded}
      itemsSelected={selected}
      onSelectedItemsChange={setSelected}
      renderItemActions={renderItemActions}
    />
  );
}

for (const [name, SkinComponent] of skins) {
  test(`the ${name} skin renders, selects and collapses`, () => {
    const errors: unknown[][] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };

    const host = document.createElement("div");
    document.body.appendChild(host);
    let root: Root | undefined;

    try {
      act(() => {
        root = createRoot(host);
        root.render(<Harness Skin={SkinComponent} />);
      });

      const rows = () => Array.from(host.querySelectorAll('[role="treeitem"]')) as HTMLElement[];
      assert.deepEqual(
        rows().map((r) => r.getAttribute("aria-level")),
        ["1", "2", "1"],
        "expanded tree must render three rows"
      );
      assert.equal(host.querySelectorAll("button").length, 3, "row actions must be rendered");

      act(() => {
        rows()[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      assert.equal(rows()[2].getAttribute("aria-selected"), "true");

      act(() => {
        (rows()[0].firstElementChild as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      assert.deepEqual(
        rows().map((r) => r.getAttribute("aria-level")),
        ["1", "1"],
        "collapsing the first row must remove its child"
      );

      act(() => root?.unmount());
    } finally {
      console.error = originalError;
    }

    assert.deepEqual(errors, [], `${name} logged React warnings`);
  });
}
