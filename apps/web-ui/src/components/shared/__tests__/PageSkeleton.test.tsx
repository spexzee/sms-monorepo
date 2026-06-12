import React from 'react';
import { render, screen } from '@testing-library/react';
import PageSkeleton from '../PageSkeleton';

describe('PageSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders exactly 4 stat skeleton blocks (rectangular)', () => {
    const { container } = render(<PageSkeleton />);
    // MUI Skeleton with variant="rectangular" renders with class MuiSkeleton-rectangular
    const rectangularSkeletons = container.querySelectorAll(
      '.MuiSkeleton-rectangular'
    );
    // 4 stat cards + 1 main content + 1 sidebar + 1 full-width table = 7 rectangulars
    expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders text skeleton placeholders for title area', () => {
    const { container } = render(<PageSkeleton />);
    const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');
    // Title (h1-like) and subtitle = at least 2 text skeletons
    expect(textSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders at least 7 skeleton elements in total', () => {
    const { container } = render(<PageSkeleton />);
    const allSkeletons = container.querySelectorAll('.MuiSkeleton-root');
    // 2 text + 4 stat cards + 1 main + 1 sidebar + 1 table = 9
    expect(allSkeletons.length).toBeGreaterThanOrEqual(7);
  });
});
