import { render, screen } from '@testing-library/react';
import { AppExpandableTable } from '../AppExpandableTable';

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

// Simple expandable row component used in tests
const ExpandedRow = ({ data }: { data: { name: string } }) => (
  <div>Details: {data.name}</div>
);

const mockColumns = [{ name: 'Name', selector: (row: any) => row.name }];
const mockData = [{ name: 'Alice' }, { name: 'Bob' }];

describe('AppExpandableTable', () => {
  it('renders data rows', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={mockData}
        expandableRowsComponent={ExpandedRow}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={[]}
        isLoading
        expandableRowsComponent={ExpandedRow}
      />
    );
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('does not show rows while loading', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={mockData}
        isLoading
        expandableRowsComponent={ExpandedRow}
      />
    );
    expect(screen.queryByTestId('rows')).not.toBeInTheDocument();
  });

  it('shows the default empty message when data is empty', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={[]}
        expandableRowsComponent={ExpandedRow}
      />
    );
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('shows a custom empty message', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={[]}
        expandableRowsComponent={ExpandedRow}
        emptyMessage="No records available"
      />
    );
    expect(screen.getByText('No records available')).toBeInTheDocument();
  });

  it('renders table title when provided', () => {
    render(
      <AppExpandableTable
        title="Expandable Data"
        columns={mockColumns}
        data={mockData}
        expandableRowsComponent={ExpandedRow}
      />
    );
    expect(screen.getByText('Expandable Data')).toBeInTheDocument();
  });

  it('does not render title bar when neither title nor actions are provided', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={mockData}
        expandableRowsComponent={ExpandedRow}
      />
    );
    expect(screen.queryByText('Expandable Data')).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <AppExpandableTable
        columns={mockColumns}
        data={mockData}
        expandableRowsComponent={ExpandedRow}
        actions={<button>Export</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
