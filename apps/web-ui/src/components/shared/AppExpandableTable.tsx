import React from 'react';
import DataTableBase, { type TableColumn } from 'react-data-table-component';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import { customTableStyles } from '../../style/dataTableTheme';
import { type AppTableColumn } from './AppTable';

interface AppExpandableTableProps<T> {
  title?: string;
  columns: AppTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  expandableRowsComponent: React.ComponentType<{ data: T }>;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export const AppExpandableTable = <T,>({
  title,
  columns,
  data,
  isLoading = false,
  expandableRowsComponent,
  emptyMessage = 'No data found',
  actions,
}: AppExpandableTableProps<T>) => {
  const transformedColumns: TableColumn<T>[] = columns.map((col) => ({
    name: col.name,
    selector: col.selector as any,
    cell: col.cell,
    sortable: col.sortable,
    width: col.width,
    minWidth: col.minWidth,
    maxWidth: col.maxWidth,
    center: col.center,
    right: col.right,
  }));

  return (
    <Box sx={{ width: '100%' }}>
      {(title || actions) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
          {title && (
            <Typography variant="h5" fontWeight={700}>
              {title}
            </Typography>
          )}
          {actions}
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <DataTableBase<T>
          columns={transformedColumns}
          data={data}
          progressPending={isLoading}
          progressComponent={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          }
          noDataComponent={<Box sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">{emptyMessage}</Typography></Box>}
          customStyles={customTableStyles}
          expandableRows
          expandableRowsComponent={expandableRowsComponent}
          highlightOnHover
          responsive
        />
      </Paper>
    </Box>
  );
};
