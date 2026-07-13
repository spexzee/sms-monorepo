import { render, screen } from '@testing-library/react';
import { AppCard } from '../AppCard';

// motion must be callable: AppCard.tsx does `motion(Card)`.
// Returning the component as-is means MotionCard === Card in tests.
vi.mock('framer-motion', () => ({
  motion: Object.assign(
    (component: any) => component,
    { div: 'div', button: 'button', span: 'span' }
  ),
  AnimatePresence: ({ children }: any) => children,
}));

describe('AppCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <AppCard>
        <p>Card Content Here</p>
      </AppCard>
    );
    expect(screen.getByText('Card Content Here')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <AppCard>
        <span>Item A</span>
        <span>Item B</span>
      </AppCard>
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('accepts and renders nested components', () => {
    render(
      <AppCard>
        <AppCard>
          <p>Nested Card</p>
        </AppCard>
      </AppCard>
    );
    expect(screen.getByText('Nested Card')).toBeInTheDocument();
  });

  // Covers the hover=false branch: whileHover={hover ? { y: -4, ... } : {}}
  it('renders correctly when hover is disabled (hover=false)', () => {
    render(<AppCard hover={false}><p>Static card</p></AppCard>);
    expect(screen.getByText('Static card')).toBeInTheDocument();
  });
});
