import { render, screen, fireEvent } from '@testing-library/react';
import { AppTable } from '../AppTable';

// Mock react-data-table-component to avoid browser APIs (ResizeObserver etc.)
// and make the rendered output predictable for assertions.
vi.mock('react-data-table-component', () => ({
  default: ({
    columns = [],
    data = [],
    progressPending,
    progressComponent,
    noDataComponent,
    onRowClicked,
  }: any) => (
    <div data-testid="data-table">
      {progressPending && <div data-testid="loading-state">{progressComponent}</div>}
      {!progressPending && data.length === 0 && (
        <div data-testid="empty-state">{noDataComponent}</div>
      )}
      {!progressPending && data.length > 0 && (
        <div data-testid="rows">
          {data.map((row: any, i: number) => (
            <div key={i} data-testid={`row-${i}`} onClick={() => onRowClicked?.(row)}>
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
  { name: 'Name', selector: (row: any) => row.name, sortable: true },
  { name: 'Age', selector: (row: any) => String(row.age) },
];

const mockData = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];

describe('AppTable', () => {
  it('renders data rows using column selectors', () => {
    render(<AppTable columns={mockColumns} data={mockData} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<AppTable columns={mockColumns} data={[]} isLoading />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not show rows while loading', () => {
    render(<AppTable columns={mockColumns} data={mockData} isLoading />);
    expect(screen.queryByTestId('rows')).not.toBeInTheDocument();
  });

  it('shows the default empty message when data is empty', () => {
    render(<AppTable columns={mockColumns} data={[]} />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('shows a custom empty message', () => {
    render(<AppTable columns={mockColumns} data={[]} emptyMessage="No students enrolled" />);
    expect(screen.getByText('No students enrolled')).toBeInTheDocument();
  });

  it('renders the table title when provided', () => {
    render(<AppTable title="Student List" columns={mockColumns} data={mockData} />);
    expect(screen.getByText('Student List')).toBeInTheDocument();
  });

  it('does not render a title bar when neither title nor actions are provided', () => {
    render(<AppTable columns={mockColumns} data={mockData} />);
    expect(screen.queryByText('Student List')).not.toBeInTheDocument();
  });

  it('renders action elements when provided', () => {
    render(
      <AppTable
        columns={mockColumns}
        data={mockData}
        actions={<button>Add Student</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Add Student' })).toBeInTheDocument();
  });

  it('calls onRowClick with the correct row when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<AppTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByTestId('row-0'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('calls onRowClick with the second row when second row is clicked', () => {
    const onRowClick = vi.fn();
    render(<AppTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByTestId('row-1'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[1]);
  });

  it('renders multiple rows correctly', () => {
    render(<AppTable columns={mockColumns} data={mockData} />);
    expect(screen.getByTestId('row-0')).toBeInTheDocument();
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
  });
});
