"use client";

import { useVirtualizedTree, VirtualizedTreeSkinProps } from "../core/useVirtualizedTree";

export type VirtualizedTreeTailwindClassNames = {
  root?: string;
  row?: string;
  rowSelected?: string;
  rowFocused?: string;
  toggle?: string;
  label?: string;
  actions?: string;
};

export type VirtualizedTreeTailwindProps<T> = VirtualizedTreeSkinProps<T> & {
  classNames?: VirtualizedTreeTailwindClassNames;
};

const DEFAULT_CLASS_NAMES: Required<VirtualizedTreeTailwindClassNames> = {
  root: "h-full overflow-auto relative outline-none",
  row: "flex items-center pr-2 cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/10",
  rowSelected: "bg-black/10 hover:bg-black/10 dark:bg-white/15 dark:hover:bg-white/15",
  rowFocused: "shadow-[inset_0_0_0_2px] shadow-blue-600 dark:shadow-blue-400",
  toggle: "flex items-center justify-center shrink-0 mr-1 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100",
  label:
    "flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] text-gray-900 dark:text-gray-100",
  actions: "flex items-center gap-0.5 shrink-0",
};

function classes(...values: (string | false | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className='size-[18px]' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      {open ?
        <path d='M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z' />
      : <path d='M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z' />}
    </svg>
  );
}

function VirtualizedTree<T>({
  getItemLabel,
  renderItemActions,
  classNames,
  ...options
}: VirtualizedTreeTailwindProps<T>) {
  const tree = useVirtualizedTree(options);
  const style = { ...DEFAULT_CLASS_NAMES, ...classNames };

  return (
    <div {...tree.containerProps} className={style.root}>
      <div role='presentation' className='relative' style={{ height: tree.totalHeight }}>
        <div role='presentation' style={{ transform: `translateY(${tree.offsetY}px)` }}>
          {tree.rows.map((row) => (
            <div
              key={row.id}
              {...tree.getRowProps(row)}
              className={classes(
                style.row,
                row.isSelected && style.rowSelected,
                row.isFocusVisible && style.rowFocused
              )}
              style={{ height: tree.itemHeight, paddingLeft: row.indentPx }}>
              {row.hasChildren ?
                <div
                  {...tree.getToggleProps(row)}
                  className={style.toggle}
                  style={{ width: tree.indentWidth, height: tree.indentWidth }}>
                  <Chevron open={row.isExpanded} />
                </div>
              : <div className='mr-1 shrink-0' style={{ width: tree.indentWidth }} />}
              <div className='flex flex-1 min-w-0 items-center gap-1'>
                <span className={style.label}>{getItemLabel(row.item)}</span>
                {renderItemActions && (
                  <div {...tree.getActionsProps()} className={style.actions}>
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
