"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import { SxProps, Theme, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { useVirtualizedTree, VirtualizedTreeSkinProps } from "../core/useVirtualizedTree";

export type VirtualizedTreeMuiProps<T> = VirtualizedTreeSkinProps<T> & {
  sx?: SxProps<Theme>;
  itemSx?: SxProps<Theme>;
  labelSx?: SxProps<Theme>;
};

function asArray(sx: SxProps<Theme> | undefined) {
  return Array.isArray(sx) ? sx : [sx];
}

function VirtualizedTree<T>({
  getItemLabel,
  renderItemActions,
  sx,
  itemSx,
  labelSx,
  ...options
}: VirtualizedTreeMuiProps<T>) {
  const theme = useTheme();
  const tree = useVirtualizedTree(options);

  return (
    <Box
      {...tree.containerProps}
      sx={[{ height: "100%", overflow: "auto", position: "relative", outline: "none" }, ...asArray(sx)]}>
      <Box role='presentation' sx={{ height: `${tree.totalHeight}px`, position: "relative" }}>
        <Box role='presentation' sx={{ transform: `translateY(${tree.offsetY}px)` }}>
          {tree.rows.map((row) => (
            <Box
              key={row.id}
              {...tree.getRowProps(row)}
              sx={[
                {
                  height: `${tree.itemHeight}px`,
                  display: "flex",
                  alignItems: "center",
                  pr: 1,
                  paddingLeft: `${row.indentPx}px`,
                  cursor: "pointer",
                  userSelect: "none",
                  bgcolor: row.isSelected ? theme.palette.action.selected : "transparent",
                  boxShadow: row.isFocusVisible ? `inset 0 0 0 2px ${theme.palette.primary.main}` : "none",
                  "&:hover": {
                    bgcolor: row.isSelected ? theme.palette.action.selected : theme.palette.action.hover,
                  },
                },
                ...asArray(itemSx),
              ]}>
              {row.hasChildren ?
                <Box
                  {...tree.getToggleProps(row)}
                  sx={{
                    width: tree.indentWidth,
                    height: tree.indentWidth,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mr: 0.5,
                    cursor: "pointer",
                    color: theme.palette.text.secondary,
                    "&:hover": { color: theme.palette.text.primary },
                  }}>
                  {row.isExpanded ?
                    <ExpandMoreIcon sx={{ fontSize: "1.125rem" }} />
                  : <ChevronRightIcon sx={{ fontSize: "1.125rem" }} />}
                </Box>
              : <Box sx={{ width: tree.indentWidth, flexShrink: 0, mr: 0.5 }} />}

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1, minWidth: 0 }}>
                <Typography
                  component='span'
                  sx={[
                    {
                      fontSize: "0.8125rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      minWidth: 0,
                    },
                    ...asArray(labelSx),
                  ]}>
                  {getItemLabel(row.item)}
                </Typography>
                {renderItemActions && (
                  <Box
                    {...tree.getActionsProps()}
                    sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                    {renderItemActions(row.item, row.id)}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default VirtualizedTree;
