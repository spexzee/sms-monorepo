import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppButton } from '../AppButton';

// Mock framer-motion: `motion` must be a callable function because
// AppButton.tsx calls motion(Button). Object.assign gives it the HTML
// shorthand props (.button, .div) while keeping it callable.
vi.mock('framer-motion', () => ({
  motion: Object.assign(
    (component: any) => component, // motion(Button) → Button
    { button: 'button', div: 'div', span: 'span', a: 'a' }
  ),
  AnimatePresence: ({ children }: any) => children,
}));

describe('AppButton', () => {
  it('renders children text', () => {
    render(<AppButton>Click Me</AppButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('shows CircularProgress and disables button when loading', () => {
    render(<AppButton loading>Submit</AppButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // CircularProgress renders an svg role="progressbar"
    expect(button.querySelector('svg, [role="progressbar"]')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    render(<AppButton disabled>Save</AppButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading even if disabled is false', () => {
    render(<AppButton loading disabled={false}>Save</AppButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<AppButton onClick={handleClick}>Press</AppButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<AppButton disabled onClick={handleClick}>Press</AppButton>);
    // MUI disabled button has pointer-events:none — use fireEvent (bypasses CSS check)
    // HTML disabled attribute prevents the click from reaching the handler
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
