import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppSelect } from '../AppSelect';

const mockOptions = [
  { value: 'math', label: 'Mathematics' },
  { value: 'sci', label: 'Science' },
  { value: 'eng', label: 'English' },
];

describe('AppSelect', () => {
  it('renders the label when provided', () => {
    render(<AppSelect label="Subject" options={mockOptions} />);
    expect(screen.getByText('Subject')).toBeInTheDocument();
  });

  it('renders labelHint in parentheses when provided', () => {
    render(<AppSelect label="Subject" labelHint="required" options={mockOptions} />);
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('does not render label when label prop is omitted', () => {
    const { container } = render(<AppSelect options={mockOptions} />);
    // No label typography should be rendered
    expect(container.querySelector('.MuiTypography-subtitle2')).not.toBeInTheDocument();
  });

  it('renders helper text when helperText prop is provided', () => {
    render(
      <AppSelect options={mockOptions} helperText="Pick one subject" />
    );
    expect(screen.getByText('Pick one subject')).toBeInTheDocument();
  });

  it('does not render helper text when helperText is omitted', () => {
    render(<AppSelect options={mockOptions} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('renders all option values after opening the dropdown', async () => {
    render(<AppSelect label="Subject" options={mockOptions} />);
    // MUI Select opens on mouseDown, not click
    fireEvent.mouseDown(screen.getByRole('combobox'));
    // Options render in a portal — use findByRole (async)
    expect(await screen.findByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Science' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  }, 10000);

  it('calls onChange when an option is selected', async () => {
    const handleChange = vi.fn();
    render(
      <AppSelect label="Subject" options={mockOptions} onChange={handleChange} />
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const sciOption = await screen.findByRole('option', { name: 'Science' });
    fireEvent.click(sciOption);
    expect(handleChange).toHaveBeenCalled();
  }, 10000);
});
