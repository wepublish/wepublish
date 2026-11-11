import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import {
  MailProviderSettingsDocument,
  PaymentProviderSettingsDocument,
  SettingsIntegrationsAiDocument,
  SyncProviderSettingsDocument,
} from '@wepublish/editor/api';
import {
  CanGetAISettings,
  CanGetLetterProviderSettings,
  CanGetMailchimpSyncSettings,
  CanGetMailProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetPdfRendererSettings,
} from '@wepublish/permissions';
import { AuthContext, FeaturesProvider } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { IntegrationList } from './integrationList';

const queryResults = new Map<unknown, unknown>();
let features: string[] = [];

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown) =>
    queryResults.has(document) ?
      { data: queryResults.get(document), loading: false }
    : { data: { features }, loading: false },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderList = ({
  permissions = [CanGetAISettings.id],
  enabledFeatures = [],
}: { permissions?: string[]; enabledFeatures?: string[] } = {}) => {
  features = enabledFeatures;

  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AuthContext.Provider
        value={
          {
            session: {
              email: 'karl@wepublish.ch',
              sessionToken: 't',
              sessionRoles: [
                { id: 'role', permissions: permissions.map(id => ({ id })) },
              ],
            },
          } as never
        }
      >
        <FeaturesProvider>
          <MemoryRouter>
            <IntegrationList />
          </MemoryRouter>
        </FeaturesProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

const letterPermissions = [
  CanGetMailProviderSettings.id,
  CanGetLetterProviderSettings.id,
  CanGetPdfRendererSettings.id,
];

const card = (title: string) =>
  screen.getByRole('heading', { level: 3, name: title }).closest('article')!;

describe('IntegrationList', () => {
  beforeEach(() => {
    queryResults.clear();
  });

  it('titles the page, each purpose and each integration as headings', () => {
    renderList();

    expect(
      screen.getByRole('heading', { level: 1, name: /integrations.title/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'integrations.groups.website.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'integrations.ai' })
    ).toBeInTheDocument();
  });

  it('only shows the purposes the user can configure something in', () => {
    renderList();

    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'integrations.groups.payments.title',
      })
    ).toBeNull();
  });

  it('says what an integration is for without hiding it in a tooltip', () => {
    renderList();

    expect(
      within(card('integrations.ai')).getByText('integrations.aiInfo')
    ).toBeVisible();
  });

  it('offers to set up an integration that has no provider yet', () => {
    queryResults.set(SettingsIntegrationsAiDocument, { aiSettings: [] });
    renderList();

    const link = within(card('integrations.ai')).getByRole('link', {
      name: 'integrations.overview.setUp',
    });

    expect(link).toHaveAttribute('href', '/integrations/ai');
    expect(link).toHaveAccessibleDescription('integrations.ai');
    expect(
      within(card('integrations.ai')).getByText('integrations.status.notSetUp')
    ).toBeInTheDocument();
  });

  it('shows which providers are connected and which need attention', () => {
    queryResults.set(PaymentProviderSettingsDocument, {
      paymentProviderSettings: [
        { id: 'stripe', name: 'Stripe', type: 'STRIPE', isApiKeySet: false },
      ],
    });
    renderList({ permissions: [CanGetPaymentProviderSettings.id] });

    const payment = card('integrations.paymentProvider');

    expect(
      within(payment).getByText('integrations.status.incomplete')
    ).toBeInTheDocument();
    expect(within(payment).getByText('Stripe')).toBeInTheDocument();
    expect(
      within(payment).getByRole('link', {
        name: 'integrations.overview.manage',
      })
    ).toBeInTheDocument();
  });

  it('explains the two Mailchimp integrations next to each other', () => {
    queryResults.set(MailProviderSettingsDocument, {
      mailProviderSettings: [],
    });
    queryResults.set(SyncProviderSettingsDocument, {
      syncProviderSettings: [],
    });
    renderList({
      permissions: [
        CanGetMailProviderSettings.id,
        CanGetMailchimpSyncSettings.id,
      ],
    });

    expect(
      screen.getByText('integrations.groups.email.mailchimpNote')
    ).toBeInTheDocument();
  });

  it('names the supported providers', () => {
    renderList();

    expect(
      screen.getByRole('img', { name: 'v0 by Vercel' })
    ).toBeInTheDocument();
  });

  it('hides the letter integrations while paper letters are off', () => {
    renderList({ permissions: letterPermissions });

    expect(screen.getByText('integrations.mailProvider')).toBeTruthy();
    expect(screen.queryByText('integrations.letterProvider')).toBeNull();
    expect(screen.queryByText('integrations.pdfRenderer')).toBeNull();
    expect(screen.queryByText('integrations.groups.print.title')).toBeNull();
  });

  it('shows them once the medium has the feature', () => {
    renderList({
      permissions: letterPermissions,
      enabledFeatures: ['paper-letters'],
    });

    expect(screen.getByText('integrations.letterProvider')).toBeTruthy();
    expect(screen.getByText('integrations.pdfRenderer')).toBeTruthy();
  });
});
