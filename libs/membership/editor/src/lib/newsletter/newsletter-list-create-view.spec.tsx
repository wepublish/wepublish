import type { Mock } from 'vitest';
import type { ComponentType } from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCreateNewsletterListMutation } from '@wepublish/editor/api';
import { NewsletterListCreateView } from './newsletter-list-create-view';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useCreateNewsletterListMutation: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent:
    () =>
    <P extends object>(Component: ComponentType<P>) =>
      Component,
  SelectMemberPlans: () => <div data-testid="select-member-plans" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const createNewsletterList = vi.fn();

beforeEach(() => {
  createNewsletterList.mockReset();
  (useCreateNewsletterListMutation as Mock).mockReturnValue([
    createNewsletterList,
    { loading: false },
  ]);
});

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <NewsletterListCreateView />
      </MemoryRouter>
    </ThemeProvider>
  );

const fillNameAndSlug = () => {
  fireEvent.change(screen.getByLabelText('newsletter.form.name'), {
    target: { value: 'Members' },
  });
  fireEvent.change(screen.getByLabelText('newsletter.form.slug'), {
    target: { value: 'members' },
  });
};

describe('NewsletterListCreateView', () => {
  it('creates a public list', async () => {
    renderView();
    fillNameAndSlug();

    fireEvent.click(screen.getAllByText('save')[0]);

    await waitFor(() =>
      expect(createNewsletterList).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          name: 'Members',
          slug: 'members',
          requiresSubscription: false,
        }),
      })
    );
  });

  it('does not save a subscriber-only list without member plans', async () => {
    renderView();
    fillNameAndSlug();

    fireEvent.click(
      screen.getByLabelText('newsletter.form.requiresSubscription')
    );
    fireEvent.click(screen.getAllByText('save')[0]);

    await screen.findAllByText('newsletter.form.memberPlansRequired');
    expect(createNewsletterList).not.toHaveBeenCalled();
  });
});
