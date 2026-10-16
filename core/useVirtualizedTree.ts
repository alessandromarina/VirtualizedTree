import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type VirtualizedTreeSelectionMode = "single" | "multiple";

export type VirtualizedTreeOptions<T> = {
  items: T[];
  getItemId: (item: T) => string;
  getItemChildren?: (item: T) => T[] | undefined;
  itemsExpanded: string[];
  onExpandedItemsChange: (itemIds: string[]) => void;
  itemsSelected: string[];
  onSelectedItemsChange: (itemIds: string[]) => void;
  selectionMode?: VirtualizedTreeSelectionMode;
  itemHeight?: number;
  indentWidth?: number;
  overscan?: number;
  scrollToItemId?: string | null;
  onScrollComplete?: () => void;
  scrollBehavior?: ScrollBehavior;
  scrollSettleMs?: number;
  ariaLabel?: string;
  hoverExpand?: boolean;
  expandOnSelect?: boolean;
};

export type VirtualizedTreeSkinProps<T> = VirtualizedTreeOptions<T> & {
  getItemLabel: (item: T) => string;
  renderItemActions?: (item: T, itemId: string) => React.ReactNode;
};

export type VirtualizedTreeRow<T> = {
  item: T;
  id: string;
  index: number;
  depth: number;
  indentPx: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isFocusVisible: boolean;
};

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export type VirtualizedTreeApi<T> = {
  containerProps: DivProps & { ref: React.Ref<HTMLDivElement>; tabIndex: number };
  rows: VirtualizedTreeRow<T>[];
  getRowProps: (row: VirtualizedTreeRow<T>) => DivProps;
  getToggleProps: (row: VirtualizedTreeRow<T>) => DivProps;
  getActionsProps: (row?: VirtualizedTreeRow<T>) => DivProps;
  itemHeight: number;
  indentWidth: number;
  totalHeight: number;
  offsetY: number;
};

type FlatNode<T> = {
  item: T;
  id: string;
  depth: number;
  parentIndex: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

export const VIRTUALIZED_TREE_DEFAULTS = {
  itemHeight: 32,
  indentWidth: 20,
  overscan: 5,
  scrollSettleMs: 300,
  labelPadding: 4,
} as const;

const NAVIGATION_KEYS = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "];

export function useVirtualizedTree<T>({
  items,
  getItemId,
  getItemChildren,
  itemsExpanded,
  onExpandedItemsChange,
  itemsSelected,
  onSelectedItemsChange,
  selectionMode = "single",
  itemHeight = VIRTUALIZED_TREE_DEFAULTS.itemHeight,
  indentWidth = VIRTUALIZED_TREE_DEFAULTS.indentWidth,
  overscan = VIRTUALIZED_TREE_DEFAULTS.overscan,
  scrollToItemId,
  onScrollComplete,
  scrollBehavior = "smooth",
  scrollSettleMs = VIRTUALIZED_TREE_DEFAULTS.scrollSettleMs,
  ariaLabel,
  hoverExpand = false,
  expandOnSelect = false,
}: VirtualizedTreeOptions<T>): VirtualizedTreeApi<T> {
  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorIndexRef = useRef<number | null>(null);
  const pointerDownRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [hoverIds, setHoverIds] = useState<string[]>([]);

  const expandedItems = useMemo(
    () => (hoverExpand && hoverIds.length > 0 ? Array.from(new Set([...itemsExpanded, ...hoverIds])) : itemsExpanded),
    [hoverExpand, hoverIds, itemsExpanded]
  );

  const { flatNodes, indexById } = useMemo(() => {
    const nodes: FlatNode<T>[] = [];
    const byId = new Map<string, number>();
    const expanded = new Set(expandedItems);

    const flatten = (itemsList: T[], depth: number, parentIndex: number) => {
      itemsList.forEach((item) => {
        const id = getItemId(item);
        const children = getItemChildren?.(item);
        const hasChildren = Boolean(children && children.length > 0);
        const isExpanded = expanded.has(id);
        const index = nodes.length;

        byId.set(id, index);
        nodes.push({ item, id, depth, parentIndex, hasChildren, isExpanded });

        if (hasChildren && isExpanded) {
          flatten(children as T[], depth + 1, index);
        }
      });
    };

    flatten(items, 0, -1);
    return { flatNodes: nodes, indexById: byId };
  }, [items, expandedItems, getItemId, getItemChildren]);

  useEffect(() => {
    if (focusedId !== null && !indexById.has(focusedId)) {
      setFocusedId(null);
    }
  }, [focusedId, indexById]);

  const selectedSet = useMemo(() => new Set(itemsSelected), [itemsSelected]);
  const expandedSet = useMemo(() => new Set(itemsExpanded), [itemsExpanded]);

  const totalHeight = flatNodes.length * itemHeight;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(flatNodes.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, flatNodes.length, itemHeight, overscan]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollToItemId || !containerRef.current) {
      return;
    }

    const targetIndex = indexById.get(scrollToItemId);
    if (targetIndex === undefined) {
      return;
    }

    containerRef.current.scrollTo({ top: targetIndex * itemHeight, behavior: scrollBehavior });

    const timer = setTimeout(() => onScrollComplete?.(), scrollSettleMs);
    return () => clearTimeout(timer);
  }, [scrollToItemId, indexById, itemHeight, scrollBehavior, scrollSettleMs, onScrollComplete]);

  const isWithin = useCallback(
    (index: number, ancestorId: string) => {
      let current = index;
      while (current >= 0) {
        const node = flatNodes[current];
        if (node.id === ancestorId) {
          return true;
        }
        current = node.parentIndex;
      }
      return false;
    },
    [flatNodes]
  );

  const keepHoverAround = useCallback(
    (index: number, extraId?: string) => {
      setHoverIds((prev) => {
        const kept = prev.filter((id) => isWithin(index, id));
        const next = extraId !== undefined && !kept.includes(extraId) ? [...kept, extraId] : kept;
        return next.length === prev.length && next.every((id, i) => id === prev[i]) ? prev : next;
      });
    },
    [isWithin]
  );

  const commitHoverAncestors = useCallback(
    (index: number, id: string) => {
      const promoted = hoverIds.filter((h) => h !== id && isWithin(index, h));
      if (promoted.length === 0) {
        return;
      }
      setHoverIds((prev) => prev.filter((h) => !promoted.includes(h)));
      onExpandedItemsChange(Array.from(new Set([...itemsExpanded, ...promoted])));
    },
    [hoverIds, isWithin, itemsExpanded, onExpandedItemsChange]
  );

  const setExpanded = useCallback(
    (id: string, expanded: boolean) => {
      const index = indexById.get(id);
      const promoted = index === undefined ? [] : hoverIds.filter((h) => h !== id && isWithin(index, h));
      const cleared = hoverIds.filter((h) => h === id || promoted.includes(h));
      if (cleared.length > 0) {
        setHoverIds((prev) => prev.filter((h) => !cleared.includes(h)));
      }
      const next = new Set([...itemsExpanded, ...promoted]);
      if (expanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      if (next.size !== itemsExpanded.length || Array.from(next).some((x) => !itemsExpanded.includes(x))) {
        onExpandedItemsChange(Array.from(next));
      }
    },
    [indexById, hoverIds, isWithin, itemsExpanded, onExpandedItemsChange]
  );

  const selectOnly = useCallback(
    (id: string) => {
      const isOnlySelection = selectedSet.size === 1 && selectedSet.has(id);
      onSelectedItemsChange(isOnlySelection ? [] : [id]);
    },
    [selectedSet, onSelectedItemsChange]
  );

  const selectRange = useCallback(
    (fromIndex: number, toIndex: number) => {
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      onSelectedItemsChange(flatNodes.slice(start, end + 1).map((node) => node.id));
    },
    [flatNodes, onSelectedItemsChange]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      onSelectedItemsChange(selectedSet.has(id) ? itemsSelected.filter((x) => x !== id) : [...itemsSelected, id]);
    },
    [selectedSet, itemsSelected, onSelectedItemsChange]
  );

  const handleSelect = useCallback(
    (index: number, modifiers: { range: boolean; toggle: boolean }) => {
      const node = flatNodes[index];
      if (!node) {
        return;
      }

      setFocusedId(node.id);

      const promoted = hoverIds.filter((id) => id !== node.id && isWithin(index, id));
      if (promoted.length > 0) {
        setHoverIds((prev) => prev.filter((id) => !promoted.includes(id)));
      }
      const commitExpansion = (includeSelf: boolean) => {
        const additions =
          includeSelf && expandOnSelect && node.hasChildren && !node.isExpanded ? [...promoted, node.id] : promoted;
        if (additions.length > 0) {
          onExpandedItemsChange(Array.from(new Set([...itemsExpanded, ...additions])));
        }
      };

      if (selectionMode === "multiple" && modifiers.range && anchorIndexRef.current !== null) {
        commitExpansion(true);
        selectRange(anchorIndexRef.current, index);
        return;
      }

      anchorIndexRef.current = index;

      if (selectionMode === "multiple" && modifiers.toggle) {
        commitExpansion(!selectedSet.has(node.id));
        toggleSelection(node.id);
        return;
      }

      commitExpansion(!(selectedSet.size === 1 && selectedSet.has(node.id)));
      selectOnly(node.id);
    },
    [
      flatNodes,
      hoverIds,
      isWithin,
      expandOnSelect,
      itemsExpanded,
      onExpandedItemsChange,
      selectedSet,
      selectionMode,
      selectRange,
      toggleSelection,
      selectOnly,
    ]
  );

  const scrollIndexIntoView = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const top = index * itemHeight;
      if (top < container.scrollTop) {
        container.scrollTop = top;
      } else if (top + itemHeight > container.scrollTop + container.clientHeight) {
        container.scrollTop = top + itemHeight - container.clientHeight;
      }
    },
    [itemHeight]
  );

  const moveFocus = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(flatNodes.length - 1, index));
      const node = flatNodes[clamped];
      if (!node) {
        return;
      }
      setFocusedId(node.id);
      scrollIndexIntoView(clamped);
    },
    [flatNodes, scrollIndexIntoView]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (flatNodes.length === 0 || !NAVIGATION_KEYS.includes(e.key)) {
        return;
      }

      e.preventDefault();
      setIsFocusVisible(true);

      const currentIndex = focusedId !== null ? (indexById.get(focusedId) ?? -1) : -1;
      if (currentIndex === -1) {
        moveFocus(0);
        return;
      }

      const node = flatNodes[currentIndex];

      switch (e.key) {
        case "ArrowDown":
          moveFocus(currentIndex + 1);
          return;
        case "ArrowUp":
          moveFocus(currentIndex - 1);
          return;
        case "Home":
          moveFocus(0);
          return;
        case "End":
          moveFocus(flatNodes.length - 1);
          return;
        case "ArrowRight":
          if (node.hasChildren && !node.isExpanded) {
            setExpanded(node.id, true);
          } else if (node.hasChildren) {
            moveFocus(currentIndex + 1);
          }
          return;
        case "ArrowLeft":
          if (node.hasChildren && node.isExpanded) {
            setExpanded(node.id, false);
          } else if (node.parentIndex >= 0) {
            moveFocus(node.parentIndex);
          }
          return;
        default:
          handleSelect(currentIndex, { range: e.shiftKey, toggle: e.ctrlKey || e.metaKey });
      }
    },
    [flatNodes, focusedId, indexById, moveFocus, setExpanded, handleSelect]
  );

  const rows = useMemo(
    () =>
      flatNodes.slice(visibleRange.startIndex, visibleRange.endIndex).map((node, offset) => ({
        item: node.item,
        id: node.id,
        index: visibleRange.startIndex + offset,
        depth: node.depth,
        indentPx: node.depth * indentWidth + VIRTUALIZED_TREE_DEFAULTS.labelPadding,
        hasChildren: node.hasChildren,
        isExpanded: node.isExpanded,
        isSelected: selectedSet.has(node.id),
        isFocusVisible: isFocusVisible && focusedId === node.id,
      })),
    [flatNodes, visibleRange, indentWidth, selectedSet, isFocusVisible, focusedId]
  );

  const containerProps = useMemo(
    () => ({
      ref: containerRef,
      role: "tree",
      tabIndex: 0,
      "aria-label": ariaLabel,
      "aria-multiselectable": selectionMode === "multiple" || undefined,
      "aria-activedescendant": focusedId !== null ? `${instanceId}-${focusedId}` : undefined,
      onScroll: (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop),
      onKeyDown: handleKeyDown,
      onPointerDown: () => {
        pointerDownRef.current = true;
        setIsFocusVisible(false);
      },
      onFocus: () => {
        setIsFocusVisible(!pointerDownRef.current);
        pointerDownRef.current = false;
      },
      onBlur: () => setIsFocusVisible(false),
      onMouseLeave: hoverExpand ? () => setHoverIds((prev) => (prev.length ? [] : prev)) : undefined,
    }),
    [ariaLabel, selectionMode, focusedId, instanceId, handleKeyDown, hoverExpand]
  );

  const getRowProps = useCallback(
    (row: VirtualizedTreeRow<T>) => ({
      id: `${instanceId}-${row.id}`,
      role: "treeitem",
      "aria-level": row.depth + 1,
      "aria-selected": row.isSelected,
      "aria-expanded": row.hasChildren ? row.isExpanded : undefined,
      "data-tree-focus": row.isFocusVisible ? "true" : undefined,
      onClick: (e: React.MouseEvent<HTMLDivElement>) =>
        handleSelect(row.index, { range: e.shiftKey, toggle: e.ctrlKey || e.metaKey }),
      onMouseEnter: hoverExpand ? () => keepHoverAround(row.index) : undefined,
    }),
    [instanceId, handleSelect, hoverExpand, keepHoverAround]
  );

  const getToggleProps = useCallback(
    (row: VirtualizedTreeRow<T>) => ({
      "aria-hidden": true,
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const isHoverOnly = hoverIds.includes(row.id) && !expandedSet.has(row.id);
        setExpanded(row.id, isHoverOnly ? true : !row.isExpanded);
      },
      onMouseEnter:
        hoverExpand ?
          () => {
            if (row.hasChildren && !expandedSet.has(row.id)) {
              keepHoverAround(row.index, row.id);
            }
          }
        : undefined,
    }),
    [setExpanded, hoverIds, expandedSet, hoverExpand, keepHoverAround]
  );

  const getActionsProps = useCallback(
    (row?: VirtualizedTreeRow<T>) => ({
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (row) {
          commitHoverAncestors(row.index, row.id);
        }
      },
    }),
    [commitHoverAncestors]
  );

  return {
    containerProps,
    rows,
    getRowProps,
    getToggleProps,
    getActionsProps,
    itemHeight,
    indentWidth,
    totalHeight,
    offsetY: visibleRange.startIndex * itemHeight,
  };
}

export default useVirtualizedTree;
