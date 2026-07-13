import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws to trigger the error boundary
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from ThrowingComponent');
  }
  return <p>Child rendered successfully</p>;
};

// Suppress console.error noise from intentional throws in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => { });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>Normal content</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  // React 19 commits ErrorBoundary fallback asynchronously \u2014 use findBy* (async)
  it('renders error UI when a child throws', async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(
      await screen.findByText(/oops! something went wrong/i, {}, { timeout: 10000 })
    ).toBeInTheDocument();
  }, 12000);

  it('does not render children after an error', async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    // Wait for error UI to appear, then assert child is gone
    await screen.findByText(/oops! something went wrong/i, {}, { timeout: 10000 });
    expect(screen.queryByText('Child rendered successfully')).not.toBeInTheDocument();
  }, 12000);

  it('shows Refresh Page button on error', async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(
      await screen.findByRole('button', { name: /refresh page/i }, { timeout: 10000 })
    ).toBeInTheDocument();
  }, 12000);

  it('shows Go Home button on error', async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(
      await screen.findByRole('button', { name: /go home/i }, { timeout: 10000 })
    ).toBeInTheDocument();
  }, 12000);

  it('shows apology message on error', async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(
      await screen.findByText(/something unexpected happened/i, {}, { timeout: 10000 })
    ).toBeInTheDocument();
  }, 12000);

  it('calls window.location.reload on Refresh Page click', async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /refresh page/i }, { timeout: 10000 })
    );
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  }, 15000);

  // Covers handleGoHome (ErrorBoundary.tsx lines 40-41)
  it('sets window.location.href to "/" when Go Home button is clicked', async () => {
    // Replace location with a plain writable object so href assignment is captured
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: '' },
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /go home/i }, { timeout: 10000 })
    );
    expect(window.location.href).toBe('/');
  }, 15000);
});
