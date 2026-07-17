import React from 'react';
import DataTableBase, { type TableColumn } from 'react-data-table-component';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import { customTableStyles } from '../../style/dataTableTheme';

export interface AppTableColumn<T> {
  name: string;
  selector?: (row: T) => any;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  center?: boolean;
  right?: boolean;
}

export interface AppTableProps<T> {
  title?: string;
  columns: AppTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectableRows?: boolean;
  onSelectedRowsChange?: (selected: { selectedRows: T[] }) => void;
  actions?: React.ReactNode;
  pagination?: boolean;
  paginationPerPage?: number;
  paginationServer?: boolean;
  paginationTotalRows?: number;
  onChangePage?: (page: number) => void;
  onChangeRowsPerPage?: (currentRowsPerPage: number, currentPage: number) => void;
}

export const AppTable = <T,>({
  title,
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
  onRowClick,
  selectableRows = false,
  onSelectedRowsChange,
  actions,
  pagination = true,
  paginationPerPage = 10,
  paginationServer = false,
  paginationTotalRows = 0,
  onChangePage,
  onChangeRowsPerPage,
}: AppTableProps<T>) => {
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

  const LoadingComponent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
      <CircularProgress size={40} />
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Loading data...
      </Typography>
    </Box>
  );

  const NoDataComponent = () => (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography color="text.secondary">{emptyMessage}</Typography>
    </Box>
  );

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
          progressComponent={<LoadingComponent />}
          noDataComponent={<NoDataComponent />}
          customStyles={customTableStyles}
          selectableRows={selectableRows}
          onSelectedRowsChange={onSelectedRowsChange}
          onRowClicked={onRowClick}
          highlightOnHover
          pointerOnHover={!!onRowClick}
          responsive
          pagination={pagination}
          paginationPerPage={paginationPerPage}
          paginationServer={paginationServer}
          paginationTotalRows={paginationTotalRows}
          onChangePage={onChangePage}
          onChangeRowsPerPage={onChangeRowsPerPage}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>
    </Box>
  );
};
