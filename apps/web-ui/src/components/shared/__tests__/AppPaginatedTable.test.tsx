import { render, screen } from '@testing-library/react';
import { AppPaginatedTable } from '../AppPaginatedTable';

vi.mock('react-data-table-component', () => ({
  default: ({
    columns = [],
    data = [],
    progressPending,
    progressComponent,
    noDataComponent,
  }: any) => (
    <div data-testid="data-table">
      {progressPending && <div data-testid="loading-state">{progressComponent}</div>}
      {!progressPending && data.length === 0 && (
        <div data-testid="empty-state">{noDataComponent}</div>
      )}
      {!progressPending && data.length > 0 && (
        <div data-testid="rows">
          {data.map((row: any, i: number) => (
            <div key={i} data-testid={`row-${i}`}>
              {columns.map((col: any) => (
                <span key={col.name}>
                  {typeof col.selector === 'function' ? col.selector(row) : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

const mockColumns = [
  { name: 'Student', selector: (row: any) => row.name },
  { name: 'Grade', selector: (row: any) => row.grade },
];
const mockData = [
  { name: 'Alice', grade: 'A' },
  { name: 'Bob', grade: 'B' },
];

describe('AppPaginatedTable', () => {
  const noop = vi.fn();

  it('renders data rows', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={mockData}
        totalRows={2}
        handlePageChange={noop}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders the table title when provided', () => {
    render(
      <AppPaginatedTable
        title="Student Records"
        columns={mockColumns}
        data={mockData}
        totalRows={2}
        handlePageChange={noop}
      />
    );
    expect(screen.getByText('Student Records')).toBeInTheDocument();
  });

  it('does not render a title bar when neither title nor actions are provided', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={mockData}
        totalRows={2}
        handlePageChange={noop}
      />
    );
    expect(screen.queryByText('Student Records')).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={[]}
        totalRows={0}
        isLoading
        handlePageChange={noop}
      />
    );
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('does not show rows while loading', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={mockData}
        totalRows={2}
        isLoading
        handlePageChange={noop}
      />
    );
    expect(screen.queryByTestId('rows')).not.toBeInTheDocument();
  });

  it('shows the default empty message when data is empty', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={[]}
        totalRows={0}
        handlePageChange={noop}
      />
    );
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('shows a custom empty message', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={[]}
        totalRows={0}
        handlePageChange={noop}
        emptyMessage="No records found"
      />
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={mockData}
        totalRows={2}
        handlePageChange={noop}
        actions={<button>Download CSV</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
  });

  it('renders multiple data rows', () => {
    render(
      <AppPaginatedTable
        columns={mockColumns}
        data={mockData}
        totalRows={2}
        handlePageChange={noop}
      />
    );
    expect(screen.getByTestId('row-0')).toBeInTheDocument();
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
  });
});
