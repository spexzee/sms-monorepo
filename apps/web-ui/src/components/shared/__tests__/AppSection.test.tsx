import { render, screen } from '@testing-library/react';
import { AppSection } from '../AppSection';

// motion must be callable — AppSection → AppCard → motion(Card)
vi.mock('framer-motion', () => ({
  motion: Object.assign(
    (component: any) => component,
    { div: 'div', button: 'button', span: 'span' }
  ),
  AnimatePresence: ({ children }: any) => children,
}));

describe('AppSection', () => {
  it('renders the section title', () => {
    render(<AppSection title="Students">Content</AppSection>);
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('renders children inside the card', () => {
    render(<AppSection title="Reports"><p>Report Data</p></AppSection>);
    expect(screen.getByText('Report Data')).toBeInTheDocument();
  });

  it('renders action node when provided', () => {
    render(
      <AppSection
        title="Subjects"
        action={<button>Add Subject</button>}
      >
        <p>List of subjects</p>
      </AppSection>
    );
    expect(screen.getByRole('button', { name: /add subject/i })).toBeInTheDocument();
  });

  it('does not render action slot when action is omitted', () => {
    render(<AppSection title="Staff"><p>Staff list</p></AppSection>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders title and children together', () => {
    render(
      <AppSection title="Attendance">
        <span>Present: 45</span>
        <span>Absent: 5</span>
      </AppSection>
    );
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Present: 45')).toBeInTheDocument();
    expect(screen.getByText('Absent: 5')).toBeInTheDocument();
  });
});
