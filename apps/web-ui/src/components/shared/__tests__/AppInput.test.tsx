import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppInput } from '../AppInput';

describe('AppInput', () => {
  it('renders the label text when label prop is provided', () => {
    render(<AppInput label="Full Name" />);
    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  it('renders labelHint in parentheses when provided', () => {
    render(<AppInput label="DOB" labelHint="dd/mm/yyyy" />);
    expect(screen.getByText('(dd/mm/yyyy)')).toBeInTheDocument();
  });

  it('does not render label element when label is omitted', () => {
    render(<AppInput placeholder="Enter text" />);
    // No label text node should appear
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('renders an input element', () => {
    render(<AppInput label="Email" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with provided placeholder', () => {
    render(<AppInput placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('calls onChange handler when user types', async () => {
    const handleChange = vi.fn();
    render(<AppInput label="Search" onChange={handleChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with a default value', () => {
    render(<AppInput label="Name" defaultValue="John" />);
    expect(screen.getByRole('textbox')).toHaveValue('John');
  });

  it('is disabled when disabled prop is true', () => {
    render(<AppInput label="Readonly" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
