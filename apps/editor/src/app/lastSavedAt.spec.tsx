import { render, screen } from '@testing-library/react';

import { LastSavedAt } from './lastSavedAt';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { date?: Date }) =>
      `${key} ${options?.date?.toISOString()}`,
  }),
}));

describe('LastSavedAt', () => {
  it('shows when the document was last saved', () => {
    render(<LastSavedAt date="2026-09-30T14:05:00.000Z" />);

    expect(
      screen.queryByText('lastSavedAt 2026-09-30T14:05:00.000Z')
    ).not.toBeNull();
  });

  it('renders nothing for a document that was never saved', () => {
    const { container } = render(<LastSavedAt date={undefined} />);

    expect(container.innerHTML).toBe('');
  });
});
