"use client";

import React from "react";

import { useVirtualizedTree, VirtualizedTreeSkinProps } from "../core/useVirtualizedTree";

import styles from "./VirtualizedTree.module.css";

export type VirtualizedTreeCssModulesProps<T> = VirtualizedTreeSkinProps<T> & {
  className?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={styles.icon} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
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
  ...options
}: VirtualizedTreeCssModulesProps<T>) {
  const tree = useVirtualizedTree(options);

  const rootStyle = {
    "--vt-item-height": `${tree.itemHeight}px`,
    "--vt-toggle-size": `${tree.indentWidth}px`,
    "--vt-total-height": `${tree.totalHeight}px`,
    "--vt-offset-y": `${tree.offsetY}px`,
  } as React.CSSProperties;

  return (
    <div {...tree.containerProps} className={className ? `${styles.root} ${className}` : styles.root} style={rootStyle}>
      <div role='presentation' className={styles.viewport}>
        <div role='presentation' className={styles.list}>
          {tree.rows.map((row) => (
            <div
              key={row.id}
              {...tree.getRowProps(row)}
              className={styles.row}
              style={{ "--vt-indent": `${row.indentPx}px` } as React.CSSProperties}>
              {row.hasChildren ?
                <div {...tree.getToggleProps(row)} className={styles.toggle}>
                  <Chevron open={row.isExpanded} />
                </div>
              : <div className={styles.spacer} />}
              <div className={styles.main}>
                <span className={styles.label}>{getItemLabel(row.item)}</span>
                {renderItemActions && (
                  <div {...tree.getActionsProps()} className={styles.actions}>
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
