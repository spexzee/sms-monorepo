import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput } from '../PhoneInput';

describe('PhoneInput', () => {
  it('renders the +91 country code prefix', () => {
    render(<PhoneInput />);
    expect(screen.getByText('+91')).toBeInTheDocument();
  });

  it('renders with the placeholder', () => {
    render(<PhoneInput />);
    expect(screen.getByPlaceholderText('00000 00000')).toBeInTheDocument();
  });

  it('strips non-digit characters from input', async () => {
    const handleChange = vi.fn();
    render(<PhoneInput onChange={handleChange} />);
    const input = screen.getByPlaceholderText('00000 00000');
    await userEvent.type(input, 'abc123def456');
    // Each call to onChange should have a digits-only value
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const event = lastCall[0] as React.ChangeEvent<HTMLInputElement>;
    expect(event.target.value).toMatch(/^\d+$/);
  });

  it('limits input to 10 digits', async () => {
    const handleChange = vi.fn();
    render(<PhoneInput onChange={handleChange} />);
    const input = screen.getByPlaceholderText('00000 00000');
    await userEvent.type(input, '12345678901234');
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const event = lastCall[0] as React.ChangeEvent<HTMLInputElement>;
    expect(event.target.value.length).toBeLessThanOrEqual(10);
  });

  it('calls onChange with only digit characters', async () => {
    const handleChange = vi.fn();
    render(<PhoneInput onChange={handleChange} />);
    await userEvent.type(screen.getByPlaceholderText('00000 00000'), '98765');
    // All calls should have digit-only values
    handleChange.mock.calls.forEach((call) => {
      const ev = call[0] as React.ChangeEvent<HTMLInputElement>;
      expect(ev.target.value).toMatch(/^\d*$/);
    });
  });

  it('renders label when provided', () => {
    render(<PhoneInput label="Mobile Number" />);
    expect(screen.getByText('Mobile Number')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<PhoneInput disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // Covers the `if (onChange)` false branch — no onChange provided
  it('handles typing gracefully when no onChange prop is provided', async () => {
    render(<PhoneInput />);
    const input = screen.getByPlaceholderText('00000 00000');
    // Should not throw even though onChange is not provided
    await userEvent.type(input, '99887766');
    expect(input).toBeInTheDocument();
  });

  it('uses the name prop in the synthetic change event', async () => {
    const handleChange = vi.fn();
    render(<PhoneInput name="phone" onChange={handleChange} />);
    await userEvent.type(screen.getByPlaceholderText('00000 00000'), '5');
    const ev = handleChange.mock.calls[0][0] as React.ChangeEvent<HTMLInputElement>;
    expect(ev.target.name).toBe('phone');
  });
});
