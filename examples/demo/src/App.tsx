import { useCallback, useMemo, useState } from "react";

import CssModulesTree from "../../../css-modules/VirtualizedTree";
import MuiTree from "../../../mui/VirtualizedTree";
import StyledTree from "../../../styled/VirtualizedTree";
import TailwindTree from "../../../tailwind/VirtualizedTree";
import VanillaTree from "../../../vanilla/VirtualizedTree";
import { buildTree, collectIds, TreeItem } from "./data";

const { items, count } = buildTree(6, 8, 10, 20);

function Badge({ value }: { value: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 9,
        background: "#d32f2f",
        color: "#fff",
        fontSize: 11,
        fontWeight: 600,
      }}>
      {value}
    </span>
  );
}

export default function App() {
  const [expanded, setExpanded] = useState<string[]>(() => collectIds(items, 1));
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">("multiple");

  const getItemId = useCallback((item: TreeItem) => item.id, []);
  const getItemLabel = useCallback((item: TreeItem) => item.name, []);
  const getItemChildren = useCallback((item: TreeItem) => item.children, []);
  const renderItemActions = useCallback(
    (item: TreeItem) => (item.alerts > 0 ? <Badge value={item.alerts} /> : null),
    []
  );

  const shared = useMemo(
    () => ({
      items,
      getItemId,
      getItemLabel,
      getItemChildren,
      itemsExpanded: expanded,
      onExpandedItemsChange: setExpanded,
      itemsSelected: selected,
      onSelectedItemsChange: setSelected,
      selectionMode,
      renderItemActions,
    }),
    [expanded, selected, selectionMode, getItemId, getItemLabel, getItemChildren, renderItemActions]
  );

  const panels = [
    { name: "vanilla", subtitle: "zero dependencies", tree: <VanillaTree {...shared} ariaLabel='vanilla tree' /> },
    { name: "tailwind", subtitle: "utility classes", tree: <TailwindTree {...shared} ariaLabel='tailwind tree' /> },
    {
      name: "css-modules",
      subtitle: "scoped stylesheet",
      tree: <CssModulesTree {...shared} ariaLabel='css modules tree' />,
    },
    { name: "styled", subtitle: "styled-components", tree: <StyledTree {...shared} ariaLabel='styled tree' /> },
    { name: "mui", subtitle: "sx and theme", tree: <MuiTree {...shared} ariaLabel='mui tree' /> },
  ];

  return (
    <main style={{ padding: 24, maxWidth: 1800, margin: "0 auto" }}>
      <header style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>VirtualizedTree</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#555" }}>
          {count.toLocaleString("en-US")} nodes, five skins over one headless core. Expansion and selection are shared
          state, so acting on one panel moves all five; scrolling is per panel, and only the rows in view are mounted.
        </p>
      </header>

      <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "16px 0", fontSize: 13 }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          selection
          <select
            value={selectionMode}
            onChange={(e) => setSelectionMode(e.target.value as "single" | "multiple")}
            style={{ font: "inherit", padding: "2px 6px" }}>
            <option value='single'>single</option>
            <option value='multiple'>multiple</option>
          </select>
        </label>
        <span style={{ color: "#555" }}>
          {selected.length} selected, {expanded.length} expanded
        </span>
        <button type='button' onClick={() => setExpanded(collectIds(items, 3))} style={{ font: "inherit" }}>
          expand everything
        </button>
        <button type='button' onClick={() => setExpanded([])} style={{ font: "inherit" }}>
          collapse
        </button>
        <button type='button' onClick={() => setSelected([])} style={{ font: "inherit" }}>
          clear selection
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {panels.map((panel) => (
          <section
            key={panel.name}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              border: "1px solid #e3e5e8",
              borderRadius: 8,
              overflow: "hidden",
            }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #eceef0" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{panel.name}</div>
              <div style={{ fontSize: 11, color: "#777" }}>{panel.subtitle}</div>
            </div>
            <div style={{ height: 520 }}>{panel.tree}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
