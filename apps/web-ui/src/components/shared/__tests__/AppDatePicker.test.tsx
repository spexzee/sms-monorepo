import { render, screen } from '@testing-library/react';
import { AppDatePicker } from '../AppDatePicker';

// AppDatePicker wraps its own LocalizationProvider, so no outer wrapper needed.
describe('AppDatePicker', () => {
  const noop = vi.fn();

  afterEach(() => vi.clearAllMocks());

  it('renders the label text', () => {
    render(<AppDatePicker label="Start Date" onChange={noop} />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('renders labelHint in parentheses when provided', () => {
    render(<AppDatePicker label="Start Date" labelHint="optional" onChange={noop} />);
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('does not render labelHint when not provided', () => {
    render(<AppDatePicker label="Start Date" onChange={noop} />);
    // No parenthesised hint text should appear
    const hints = screen.queryAllByText(/^\(.*\)$/);
    expect(hints).toHaveLength(0);
  });

  it('renders required asterisk when required prop is set', () => {
    render(<AppDatePicker label="Start Date" required onChange={noop} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render required asterisk when required is not set', () => {
    render(<AppDatePicker label="Start Date" onChange={noop} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders helper text when provided', () => {
    render(<AppDatePicker label="Date" helperText="Select a date" onChange={noop} />);
    expect(screen.getByText('Select a date')).toBeInTheDocument();
  });

  it('does not render helper text when not provided', () => {
    render(<AppDatePicker label="Date" onChange={noop} />);
    expect(screen.queryByText('Select a date')).not.toBeInTheDocument();
  });

  it('renders an input element (textbox)', () => {
    render(<AppDatePicker label="Date" onChange={noop} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not render the label section when label is an empty string', () => {
    render(<AppDatePicker label="" onChange={noop} />);
    // labelHint and required are both hidden when label is falsy
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders with error state helper text', () => {
    render(<AppDatePicker label="Date" error helperText="Invalid date" onChange={noop} />);
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });
});
