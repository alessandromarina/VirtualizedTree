"use client";

import React from "react";

import { useVirtualizedTree, VirtualizedTreeSkinProps } from "../core/useVirtualizedTree";

export type VirtualizedTreeVanillaProps<T> = VirtualizedTreeSkinProps<T> & {
  className?: string;
  style?: React.CSSProperties;
};

const STYLES = `
.vt-root {
  --vt-row-hover: rgba(0, 0, 0, 0.04);
  --vt-row-selected: rgba(0, 0, 0, 0.08);
  --vt-focus-ring: #1976d2;
  --vt-toggle: rgba(0, 0, 0, 0.6);
  --vt-toggle-hover: rgba(0, 0, 0, 0.87);
  --vt-label: rgba(0, 0, 0, 0.87);
  --vt-font-size: 0.8125rem;
  height: 100%;
  overflow: auto;
  position: relative;
  outline: none;
}
.vt-row {
  display: flex;
  align-items: center;
  padding-right: 8px;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
}
.vt-row:hover { background-color: var(--vt-row-hover); }
.vt-row[aria-selected="true"],
.vt-row[aria-selected="true"]:hover { background-color: var(--vt-row-selected); }
.vt-row[data-tree-focus="true"] { box-shadow: inset 0 0 0 2px var(--vt-focus-ring); }
.vt-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4px;
  color: var(--vt-toggle);
}
.vt-toggle:hover { color: var(--vt-toggle-hover); }
.vt-main { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.vt-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--vt-font-size);
  color: var(--vt-label);
}
.vt-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
`;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      {open ?
        <path d='M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z' />
      : <path d='M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z' />}
    </svg>
  );
}

function VirtualizedTree<T>({
  getItemLabel,
  renderItemActions,
  className,
  style,
  ...options
}: VirtualizedTreeVanillaProps<T>) {
  const tree = useVirtualizedTree(options);

  return (
    <div {...tree.containerProps} className={className ? `vt-root ${className}` : "vt-root"} style={style}>
      <style>{STYLES}</style>
      <div role='presentation' style={{ height: tree.totalHeight, position: "relative" }}>
        <div role='presentation' style={{ transform: `translateY(${tree.offsetY}px)` }}>
          {tree.rows.map((row) => (
            <div
              key={row.id}
              {...tree.getRowProps(row)}
              className='vt-row'
              style={{ height: tree.itemHeight, paddingLeft: row.indentPx }}>
              {row.hasChildren ?
                <div
                  {...tree.getToggleProps(row)}
                  className='vt-toggle'
                  style={{ width: tree.indentWidth, height: tree.indentWidth }}>
                  <Chevron open={row.isExpanded} />
                </div>
              : <div className='vt-toggle' style={{ width: tree.indentWidth }} />}
              <div className='vt-main'>
                <span className='vt-label'>{getItemLabel(row.item)}</span>
                {renderItemActions && (
                  <div {...tree.getActionsProps()} className='vt-actions'>
                    {renderItemActions(row.item, row.id)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedTree;
