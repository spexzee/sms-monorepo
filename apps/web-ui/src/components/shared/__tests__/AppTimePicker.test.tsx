import { render, screen } from '@testing-library/react';
import { AppTimePicker } from '../AppTimePicker';

// AppTimePicker wraps its own LocalizationProvider, so no outer wrapper needed.
describe('AppTimePicker', () => {
  const noop = vi.fn();

  afterEach(() => vi.clearAllMocks());

  it('renders the label text', () => {
    render(<AppTimePicker label="Start Time" onChange={noop} />);
    expect(screen.getByText('Start Time')).toBeInTheDocument();
  });

  it('renders labelHint in parentheses when provided', () => {
    render(<AppTimePicker label="Start Time" labelHint="HH:MM" onChange={noop} />);
    expect(screen.getByText('(HH:MM)')).toBeInTheDocument();
  });

  it('does not render labelHint when not provided', () => {
    render(<AppTimePicker label="Start Time" onChange={noop} />);
    const hints = screen.queryAllByText(/^\(.*\)$/);
    expect(hints).toHaveLength(0);
  });

  it('renders required asterisk when required prop is set', () => {
    render(<AppTimePicker label="Start Time" required onChange={noop} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render required asterisk when required is not set', () => {
    render(<AppTimePicker label="Start Time" onChange={noop} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders helper text when provided', () => {
    render(<AppTimePicker label="Time" helperText="HH:MM format" onChange={noop} />);
    expect(screen.getByText('HH:MM format')).toBeInTheDocument();
  });

  it('does not render helper text when not provided', () => {
    render(<AppTimePicker label="Time" onChange={noop} />);
    expect(screen.queryByText('HH:MM format')).not.toBeInTheDocument();
  });

  it('renders an input element (textbox)', () => {
    render(<AppTimePicker label="Time" onChange={noop} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not render label section when label is an empty string', () => {
    render(<AppTimePicker label="" onChange={noop} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders with error state and helper text', () => {
    render(<AppTimePicker label="Time" error helperText="Invalid time" onChange={noop} />);
    expect(screen.getByText('Invalid time')).toBeInTheDocument();
  });
});
