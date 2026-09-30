import type { Mock } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useBackfillNewsletterListMutation } from '@wepublish/editor/api';
import { toaster } from 'rsuite';
import { NewsletterListBackfill } from './newsletter-list-backfill';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useBackfillNewsletterListMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

const backfill = vi.fn();

beforeEach(() => {
  backfill.mockReset();
  (useBackfillNewsletterListMutation as Mock).mockReturnValue([
    backfill,
    { loading: false },
  ]);
});

describe('NewsletterListBackfill', () => {
  it('asks for confirmation before adding the current subscribers', () => {
    render(<NewsletterListBackfill listId="list-1" />);

    fireEvent.click(screen.getByText('newsletter.backfill.button'));

    expect(screen.getByText('newsletter.backfill.confirmBody')).toBeTruthy();
    expect(backfill).not.toHaveBeenCalled();
  });

  it('adds the current subscribers and reports how many were added', async () => {
    const push = vi.spyOn(toaster, 'push').mockReturnValue('toast');
    backfill.mockResolvedValue({ data: { backfillNewsletterList: 42 } });

    render(<NewsletterListBackfill listId="list-1" />);

    fireEvent.click(screen.getByText('newsletter.backfill.button'));
    fireEvent.click(screen.getByText('newsletter.backfill.confirm'));

    await waitFor(() =>
      expect(backfill).toHaveBeenCalledWith({ variables: { id: 'list-1' } })
    );
    await waitFor(() => expect(push).toHaveBeenCalled());

    render(push.mock.calls[0][0] as JSX.Element);
    expect(
      screen.getByText('newsletter.backfill.success {"count":42}')
    ).toBeTruthy();
  });
});
