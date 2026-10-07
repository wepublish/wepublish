import { render, screen } from '@testing-library/react';

import { SeoAnalysis } from './seoAnalysis';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const stats = {
  wordCount: 600,
  headingCount: 2,
  linkCount: 3,
  imageCount: 4,
  imagesWithoutDescription: 1,
};

describe('SeoAnalysis', () => {
  test('shows the content stats', () => {
    render(<SeoAnalysis stats={stats} />);

    expect(screen.getByText('seoAnalysis.stats.wordCount')).toBeTruthy();
    expect(screen.getByText('600')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('1/4')).toBeTruthy();
  });

  test('does not offer an analysis', () => {
    render(<SeoAnalysis stats={stats} />);

    expect(screen.queryByRole('button')).toBe(null);
  });

  test('renders nothing without stats', () => {
    const { container } = render(<SeoAnalysis />);

    expect(container.innerHTML).toBe('');
  });
});
