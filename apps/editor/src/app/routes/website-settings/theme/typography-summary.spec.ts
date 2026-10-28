import { renderHook } from '@testing-library/react';

import { useTypographySummary } from './typography-summary';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.split('.').pop() as string,
  }),
}));

const summary = (...args: Parameters<typeof useTypographySummary>) =>
  renderHook(() => useTypographySummary(...args)).result.current;

describe('useTypographySummary', () => {
  it('lists family, size, weight and line height', () => {
    expect(
      summary(
        {
          fontFamily: "'Fraunces', serif",
          fontSize: '3rem',
          fontWeight: 700,
          lineHeight: '1.06em',
        },
        undefined,
        'h1'
      )
    ).toBe('Fraunces · 3rem · fontWeightBold · 1.06em');
  });

  it('shows the values inherited from the base', () => {
    expect(
      summary(
        {},
        { fontFamily: '"Inter", sans-serif', lineHeight: '1.6em' },
        'body1'
      )
    ).toBe('Inter · 1rem · fontWeightNormal · 1.6em');
  });

  it('shows the standard values of the theme', () => {
    expect(summary({}, null, 'h4')).toBe(
      '1.625rem · fontWeightSemiBold · 1.15em'
    );
  });

  it('leaves out what nothing sets', () => {
    expect(summary(undefined, undefined, 'articleAuthors')).toBe('');
  });

  it('shows a weight without a name as a number', () => {
    expect(summary({ fontWeight: 450 }, undefined, 'articleAuthors')).toBe(
      '450'
    );
  });
});
