"use client";

import styled from "styled-components";

import { useVirtualizedTree, VirtualizedTreeSkinProps } from "../core/useVirtualizedTree";

export type VirtualizedTreeStyledProps<T> = VirtualizedTreeSkinProps<T> & {
  className?: string;
};

const Root = styled.div`
  height: 100%;
  overflow: auto;
  position: relative;
  outline: none;
`;

const Viewport = styled.div<{ $height: number }>`
  position: relative;
  height: ${({ $height }) => $height}px;
`;

const List = styled.div<{ $offset: number }>`
  transform: translateY(${({ $offset }) => $offset}px);
`;

const Row = styled.div<{ $height: number; $selected: boolean; $focused: boolean }>`
  display: flex;
  align-items: center;
  padding-right: 8px;
  cursor: pointer;
  user-select: none;
  height: ${({ $height }) => $height}px;
  background-color: ${({ $selected }) => ($selected ? "rgba(0, 0, 0, 0.08)" : "transparent")};
  box-shadow: ${({ $focused }) => ($focused ? "inset 0 0 0 2px #1976d2" : "none")};

  &:hover {
    background-color: ${({ $selected }) => ($selected ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.04)")};
  }
`;

const Toggle = styled.div<{ $size: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4px;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  color: rgba(0, 0, 0, 0.6);

  &:hover {
    color: rgba(0, 0, 0, 0.87);
  }
`;

const Spacer = styled.div<{ $size: number }>`
  flex-shrink: 0;
  margin-right: 4px;
  width: ${({ $size }) => $size}px;
`;

const Main = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const Label = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.87);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
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

function VirtualizedTree<T>({ getItemLabel, renderItemActions, className, ...options }: VirtualizedTreeStyledProps<T>) {
  const tree = useVirtualizedTree(options);

  return (
    <Root {...tree.containerProps} className={className}>
      <Viewport role='presentation' $height={tree.totalHeight}>
        <List role='presentation' $offset={tree.offsetY}>
          {tree.rows.map((row) => (
            <Row
              key={row.id}
              {...tree.getRowProps(row)}
              $height={tree.itemHeight}
              $selected={row.isSelected}
              $focused={row.isFocusVisible}
              style={{ paddingLeft: row.indentPx }}>
              {row.hasChildren ?
                <Toggle {...tree.getToggleProps(row)} $size={tree.indentWidth}>
                  <Chevron open={row.isExpanded} />
                </Toggle>
              : <Spacer $size={tree.indentWidth} />}
              <Main>
                <Label>{getItemLabel(row.item)}</Label>
                {renderItemActions && (
                  <Actions {...tree.getActionsProps()}>{renderItemActions(row.item, row.id)}</Actions>
                )}
              </Main>
            </Row>
          ))}
        </List>
      </Viewport>
    </Root>
  );
}

export default VirtualizedTree;
