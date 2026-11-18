import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { NewsletterSettingsPage } from './newsletter-settings-page';

const queries = vi.fn();
const update = vi.fn();
const allowed = vi.fn(() => true);

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
  useMutation: () => [update, { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => allowed(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.number !== undefined ? `${key}:${options.number}` : key,
  }),
}));

const provider = (overrides: Record<string, unknown> = {}) => ({
  __typename: 'SettingSyncProvider',
  id: 'mailchimp-sync',
  type: 'MAILCHIMP',
  name: 'Mailchimp',
  enabled: true,
  mailchimp_listId: 'list-1',
  newslettersInProfile: false,
  newsletters: [
    {
      __typename: 'SettingSyncProviderNewsletter',
      id: 'n1',
      interestId: 'a',
      name: 'Morgen-Briefing',
      description: 'Jeden Morgen',
      image: null,
    },
  ],
  ...overrides,
});

const givenProviders = (providers: unknown[]) =>
  queries.mockImplementation((name: string) => {
    if (name === 'SyncProviderSettings') {
      return { data: { syncProviderSettings: providers }, loading: false };
    }

    if (name === 'MailchimpInterestGroups') {
      return {
        data: {
          mailchimpInterestGroups: [
            { id: 'a', name: 'Gruppe A' },
            { id: 'b', name: 'Gruppe B' },
          ],
        },
        loading: false,
      };
    }

    return { data: undefined, loading: false };
  });

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <NewsletterSettingsPage />
      </MemoryRouter>
    </ThemeProvider>
  );

const toggle = () =>
  screen.getByRole('switch', { name: 'newsletterSettings.showInProfile' });

describe('NewsletterSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({ data: {} });
  });

  it('describes what readers see and lists the newsletters', () => {
    givenProviders([provider()]);
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'newsletterSettings.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('newsletterSettings.description')
    ).toBeInTheDocument();
    expect(toggle()).not.toBeChecked();
    expect(screen.getByDisplayValue('Morgen-Briefing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jeden Morgen')).toBeInTheDocument();
  });

  it('loads the interests of the provider list to choose from', () => {
    givenProviders([provider()]);
    renderPage();

    expect(queries).toHaveBeenCalledWith(
      'MailchimpInterestGroups',
      expect.objectContaining({
        variables: { configId: 'mailchimp-sync', listId: 'list-1' },
        skip: false,
      })
    );
  });

  it('saves the toggle and the newsletters, and nothing else of the provider', async () => {
    const user = userEvent.setup();
    givenProviders([provider()]);
    renderPage();

    const save = screen.getByRole('button', { name: 'save' });
    expect(save).toBeDisabled();

    await user.click(toggle());
    await user.click(save);

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        variables: {
          id: 'mailchimp-sync',
          newslettersInProfile: true,
          newsletters: [
            {
              interestId: 'a',
              name: 'Morgen-Briefing',
              description: 'Jeden Morgen',
              imageID: undefined,
            },
          ],
        },
      })
    );
  });

  it('adds a newsletter', async () => {
    const user = userEvent.setup();
    givenProviders([provider({ newsletters: [] })]);
    renderPage();

    await user.click(
      screen.getByRole('button', {
        name: 'integrations.mailchimpSyncSettings.addNewsletter',
      })
    );

    expect(
      screen.getByText('blocks.mailchimpForm.interestOptionTitle:1')
    ).toBeInTheDocument();
  });

  it('points to the Mailchimp integration while no list is set up', () => {
    givenProviders([provider({ mailchimp_listId: null })]);
    renderPage();

    const hint = screen.getByRole('alert');
    expect(
      within(hint).getByRole('link', { name: 'newsletterSettings.setUpLink' })
    ).toHaveAttribute('href', '/integrations/mailchimp-sync');
    expect(
      screen.queryByRole('switch', {
        name: 'newsletterSettings.showInProfile',
      })
    ).not.toBeInTheDocument();
  });

  it('points to the Mailchimp integration without a provider', () => {
    givenProviders([]);
    renderPage();

    expect(
      within(screen.getByRole('alert')).getByRole('link', {
        name: 'newsletterSettings.setUpLink',
      })
    ).toHaveAttribute('href', '/integrations/mailchimp-sync');
  });

  it('only shows the settings to editors who may not change them', () => {
    allowed.mockReturnValue(false);
    givenProviders([provider()]);
    renderPage();

    expect(toggle()).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'save' })
    ).not.toBeInTheDocument();
  });
});
