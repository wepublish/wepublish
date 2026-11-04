import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type PaymentProviderSettingsQuery,
  type SettingsIntegrationsAiQuery,
  type SettingsIntegrationsAnalyticsQuery,
  type SettingsIntegrationsChallengeQuery,
  type TrackingPixelSettingsQuery,
  AiProviderType,
  AnalyticsProviderType,
  ChallengeProviderType,
  PaymentProviderSettingsDocument,
  PaymentProviderType,
  SettingsIntegrationsAiDocument,
  SettingsIntegrationsAnalyticsDocument,
  SettingsIntegrationsChallengeDocument,
  StripePaymentMethod,
  TrackingPixelProviderType,
  TrackingPixelSettingsDocument,
  UpdateAnalyticsProviderSettingDocument,
  UpdatePaymentProviderSettingDocument,
  UpdateSettingsIntegrationsAiDocument,
  UpdateSettingsIntegrationsChallengeDocument,
  UpdateTrackingPixelSettingDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanGetAISettings,
  CanGetAnalyticsProviderSettings,
  CanGetChallengeProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetTrackingPixelSettings,
  CanUpdateAISettings,
  CanUpdateAnalyticsProviderSettings,
  CanUpdateChallengeProviderSettings,
  CanUpdatePaymentProviderSettings,
  CanUpdateTrackingPixelSettings,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { DocumentNode } from 'graphql';
import type { ReactNode } from 'react';

import { IntegrationEditView } from './integrationEditView';

const readPermissions = [
  CanGetAISettings,
  CanGetAnalyticsProviderSettings,
  CanGetChallengeProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetTrackingPixelSettings,
];

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'admin@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'admin',
        name: 'admin',
        description: null,
        systemRole: false,
        permissions: permissions.map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
});

const admin = sessionWith([
  ...readPermissions,
  CanUpdateAISettings,
  CanUpdateAnalyticsProviderSettings,
  CanUpdateChallengeProviderSettings,
  CanUpdatePaymentProviderSettings,
  CanUpdateTrackingPixelSettings,
]);

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );

const timestamps = {
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  lastLoadedAt: '2026-02-01T00:00:00.000Z',
};

const v0: SettingsIntegrationsAiQuery['aiSettings'][number] = {
  __typename: 'SettingAIProvider',
  ...timestamps,
  id: 'v0',
  name: 'V0',
  type: AiProviderType.V0,
  systemPrompt: 'Be nice',
  isApiKeySet: true,
};

const google: SettingsIntegrationsAnalyticsQuery['analyticsProviderSettings'][number] =
  {
    __typename: 'SettingAnalyticsProvider',
    ...timestamps,
    id: 'google-analytics',
    name: 'Google Analytics',
    type: AnalyticsProviderType.Google,
    articlePrefix: '/a/',
    property: '123',
    isCredentialsSet: true,
  };

const turnstile: SettingsIntegrationsChallengeQuery['challengeProviderSettings'][number] =
  {
    __typename: 'SettingChallengeProvider',
    ...timestamps,
    id: 'turnstile',
    name: 'Turnstile',
    type: ChallengeProviderType.Turnstile,
    isSecretSet: false,
  };

type PaymentSetting =
  PaymentProviderSettingsQuery['paymentProviderSettings'][number];

const emptyPayment: Omit<PaymentSetting, 'id' | 'name' | 'type'> = {
  __typename: 'SettingPaymentProvider',
  ...timestamps,
  deletedAt: null,
  isApiKeySet: false,
  isWebhookEndpointSecretSet: false,
  bexio_accountId: null,
  bexio_countryId: null,
  bexio_invoiceMailBodyNewMembership: null,
  bexio_invoiceMailBodyRenewalMembership: null,
  bexio_invoiceMailSubjectNewMembership: null,
  bexio_invoiceMailSubjectRenewalMembership: null,
  bexio_invoiceTemplateNewMembership: null,
  bexio_invoiceTemplateRenewalMembership: null,
  bexio_invoiceTitleNewMembership: null,
  bexio_invoiceTitleRenewalMembership: null,
  bexio_markInvoiceAsOpen: null,
  bexio_taxId: null,
  bexio_unitId: null,
  bexio_userId: null,
  mollie_apiBaseUrl: null,
  mollie_methods: null,
  offSessionPayments: null,
  payrexx_instancename: null,
  payrexx_pm: null,
  payrexx_psp: null,
  payrexx_vatrate: null,
  simulated_declineRenewals: null,
  stripe_methods: null,
};

const stripe: PaymentSetting = {
  ...emptyPayment,
  id: 'stripe',
  name: 'Stripe',
  type: PaymentProviderType.Stripe,
  offSessionPayments: true,
  stripe_methods: [StripePaymentMethod.Card],
  isApiKeySet: true,
};

const bexio: PaymentSetting = {
  ...emptyPayment,
  id: 'bexio',
  name: 'Bexio',
  type: PaymentProviderType.Bexio,
  bexio_userId: 1,
  bexio_markInvoiceAsOpen: false,
  bexio_invoiceTitleNewMembership: 'Rechnung',
};

const prolitteris: TrackingPixelSettingsQuery['trackingPixelSettings'][number] =
  {
    __typename: 'SettingTrackingPixelProvider',
    ...timestamps,
    deletedAt: null,
    id: 'prolitteris',
    name: 'ProLitteris',
    type: TrackingPixelProviderType.Prolitteris,
    prolitteris_memberNr: '770005',
    prolitteris_onlyPaidContentAccess: false,
    prolitteris_publisherInternalKeyDomain: null,
    prolitteris_usePublisherInternalKey: false,
    prolitteris_username: 'user@example.ch',
    prolitteris_isPasswordSet: true,
  };

const updated = vi.fn<(variables: Record<string, unknown>) => void>();

const listMock = (
  query: DocumentNode,
  data: Record<string, unknown>
): MockLink.MockedResponse => ({
  request: { query, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { __typename: 'Query', ...data } },
});

const updateMock = (
  mutation: DocumentNode,
  field: string,
  setting: Record<string, unknown>
): MockLink.MockedResponse => ({
  request: { query: mutation, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: Record<string, unknown>) => {
    updated(JSON.parse(JSON.stringify(variables)));

    return {
      data: { __typename: 'Mutation', [field]: { ...setting, ...variables } },
    };
  },
});

const mocks = [
  listMock(SettingsIntegrationsAiDocument, { aiSettings: [v0] }),
  updateMock(UpdateSettingsIntegrationsAiDocument, 'updateAISetting', v0),
  listMock(SettingsIntegrationsAnalyticsDocument, {
    analyticsProviderSettings: [google],
  }),
  updateMock(
    UpdateAnalyticsProviderSettingDocument,
    'updateAnalyticsProviderSetting',
    google
  ),
  listMock(SettingsIntegrationsChallengeDocument, {
    challengeProviderSettings: [turnstile],
  }),
  updateMock(
    UpdateSettingsIntegrationsChallengeDocument,
    'updateChallengeProviderSetting',
    turnstile
  ),
  listMock(PaymentProviderSettingsDocument, {
    paymentProviderSettings: [stripe, bexio],
  }),
  updateMock(
    UpdatePaymentProviderSettingDocument,
    'updatePaymentProviderSetting',
    stripe
  ),
  listMock(TrackingPixelSettingsDocument, {
    trackingPixelSettings: [prolitteris],
  }),
  updateMock(
    UpdateTrackingPixelSettingDocument,
    'updateTrackingPixelSetting',
    prolitteris
  ),
];

const renderIntegration = (route: string, session = admin) =>
  renderFormRoutes(
    {
      '/integrations/:type': <IntegrationEditView />,
      '/integrations/:type/edit/:id': <IntegrationEditView />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

const drawer = () =>
  within(document.querySelector('.MuiDrawer-paper') as HTMLElement);

const loaded = (label: string, value: string) =>
  waitFor(() => expect(getFieldByLabel(label)).toHaveValue(value));

const credentials = {
  type: 'service_account',
  project_id: 'wepublish',
  private_key_id: 'key-1',
  private_key: '-----BEGIN PRIVATE KEY-----',
  client_email: 'analytics@wepublish.iam.gserviceaccount.com',
  client_id: '1234',
};

beforeEach(() => updated.mockClear());

describe('IntegrationEditView', () => {
  it('lists the providers and opens one in a drawer', async () => {
    const { user, currentPath } = renderIntegration('/integrations/payment');

    const card = (await screen.findByText('Stripe')).closest(
      '.MuiCard-root'
    ) as HTMLElement;

    await user.click(within(card).getByRole('link', { name: /edit/ }));

    expect(currentPath()).toBe('/integrations/payment/edit/stripe');
    await loaded('name', 'Stripe');
    expect(
      drawer().getByRole('heading', { name: 'integrations.editSetting' })
    ).toBeInTheDocument();
  });

  it('saves the AI key with the stored system prompt', async () => {
    const { user } = renderIntegration('/integrations/ai/edit/v0');

    await loaded('integrations.aiSettings.systemPrompt', 'Be nice');
    await user.type(getFieldByLabel('integrations.aiSettings.apiKey'), 'sk-1');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'v0',
        apiKey: 'sk-1',
        systemPrompt: 'Be nice',
      })
    );
  });

  it('tells which stored secrets an empty field keeps', async () => {
    renderIntegration('/integrations/ai/edit/v0');

    await loaded('integrations.aiSettings.systemPrompt', 'Be nice');
    expect(getFieldByLabel('integrations.aiSettings.apiKey')).toHaveAttribute(
      'placeholder',
      'integrations.secretStored'
    );
  });

  it('tells that a challenge secret is not set yet', async () => {
    renderIntegration('/integrations/challenge/edit/turnstile');

    await waitFor(() =>
      expect(
        getFieldByLabel('integrations.challengeSettings.secret')
      ).toHaveAttribute('placeholder', 'integrations.secretNotSet')
    );
  });

  it('tells which payment secrets are stored', async () => {
    renderIntegration('/integrations/payment/edit/stripe');

    await loaded('name', 'Stripe');
    expect(
      getFieldByLabel('integrations.paymentSettings.apiKey')
    ).toHaveAttribute('placeholder', 'integrations.secretStored');
    expect(
      getFieldByLabel('integrations.paymentSettings.webhookEndpointSecret')
    ).toHaveAttribute('placeholder', 'integrations.secretNotSet');
  });

  it('tells that the ProLitteris password is stored', async () => {
    renderIntegration('/integrations/tracking-pixel/edit/prolitteris');

    await waitFor(() =>
      expect(
        getFieldByLabel('integrations.trackingPixelSettings.prolitterisPassword')
      ).toHaveAttribute('placeholder', 'integrations.secretStored')
    );
  });

  it('tells that analytics credentials are stored until a new file is dropped', async () => {
    renderIntegration('/integrations/analytics/edit/google-analytics');

    expect(
      await screen.findByText(
        'integrations.analyticsSettings.credentialsStored'
      )
    ).toBeInTheDocument();
  });

  it('names the credentials file input without nesting it in the drop area', async () => {
    renderIntegration('/integrations/analytics/edit/google-analytics');

    await loaded('integrations.analyticsSettings.property', '123');

    const input = screen.getByTestId('credentialsFile');
    const dropArea = screen.getByRole('button', {
      name: 'integrations.analyticsSettings.credentials',
    });

    expect(input).toHaveAccessibleName(
      'integrations.analyticsSettings.credentials'
    );
    expect(dropArea).not.toContainElement(input);
  });

  it('saves the analytics property without credentials', async () => {
    const { user } = renderIntegration(
      '/integrations/analytics/edit/google-analytics'
    );

    await loaded('integrations.analyticsSettings.property', '123');
    await user.clear(getFieldByLabel('integrations.analyticsSettings.property'));
    await user.type(
      getFieldByLabel('integrations.analyticsSettings.property'),
      '456'
    );
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'google-analytics',
        articlePrefix: '/a/',
        property: '456',
      })
    );
  });

  it('saves dropped analytics credentials', async () => {
    const { user } = renderIntegration(
      '/integrations/analytics/edit/google-analytics'
    );

    await loaded('integrations.analyticsSettings.property', '123');
    await user.upload(
      screen.getByTestId('credentialsFile'),
      new File([JSON.stringify(credentials)], 'credentials.json', {
        type: 'application/json',
      })
    );
    expect(
      await screen.findByText(
        'integrations.analyticsSettings.credentialsReadyToBeSaved'
      )
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'google-analytics',
        articlePrefix: '/a/',
        property: '123',
        credentials,
      })
    );
  });

  it('saves the challenge keys', async () => {
    const { user } = renderIntegration('/integrations/challenge/edit/turnstile');

    await loaded('name', 'Turnstile');
    await user.type(
      getFieldByLabel('integrations.challengeSettings.siteKey'),
      'site-key'
    );
    await user.type(
      getFieldByLabel('integrations.challengeSettings.secret'),
      'top-secret'
    );
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'turnstile',
        name: 'Turnstile',
        type: ChallengeProviderType.Turnstile,
        siteKey: 'site-key',
        secret: 'top-secret',
      })
    );
  });

  it('asks before a new challenge type deletes the stored keys', async () => {
    const { user } = renderIntegration('/integrations/challenge/edit/turnstile');

    await loaded('name', 'Turnstile');
    await user.click(
      screen.getByRole('combobox', {
        name: /integrations\.challengeSettings\.type/,
      })
    );
    await user.click(
      await screen.findByRole('option', { name: ChallengeProviderType.Hcaptcha })
    );
    await user.click(screen.getByTestId('saveButton'));

    const question = await screen.findByRole('dialog', {
      name: 'integrations.typeChangeTitle',
    });

    await user.click(
      within(question).getByRole('button', { name: 'integrations.cancel' })
    );
    expect(updated).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('saveButton'));
    await user.click(
      await screen.findByRole('button', {
        name: 'integrations.typeChangeConfirm',
      })
    );

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'turnstile',
        name: 'Turnstile',
        type: ChallengeProviderType.Hcaptcha,
      })
    );
  });

  it('saves only the fields of a Stripe provider', async () => {
    const { user } = renderIntegration('/integrations/payment/edit/stripe');

    await loaded('name', 'Stripe');
    expect(
      getFieldByLabel('integrations.paymentSettings.webhookEndpointSecret')
    ).toBeInTheDocument();
    expect(
      queryFieldByLabel('integrations.paymentSettings.bexioUserId')
    ).not.toBeInTheDocument();
    await user.clear(getFieldByLabel('name'));
    await user.type(getFieldByLabel('name'), 'Stripe CH');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'stripe',
        name: 'Stripe CH',
        offSessionPayments: true,
        stripe_methods: [StripePaymentMethod.Card],
      })
    );
  });

  it('saves the Bexio fields as numbers, without a webhook secret', async () => {
    const { user } = renderIntegration('/integrations/payment/edit/bexio');

    await loaded('name', 'Bexio');
    expect(
      queryFieldByLabel('integrations.paymentSettings.webhookEndpointSecret')
    ).not.toBeInTheDocument();
    expect(
      formSectionOf('integrations.paymentSettings.bexioInvoice').getByLabelText(
        /bexioInvoiceTitleNewMembership/,
        { selector: 'input' }
      )
    ).toHaveValue('Rechnung');
    await user.type(
      getFieldByLabel('integrations.paymentSettings.bexioUserId'),
      '{Backspace}42'
    );
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'bexio',
        name: 'Bexio',
        offSessionPayments: null,
        bexio_userId: 42,
        bexio_countryId: null,
        bexio_unitId: null,
        bexio_taxId: null,
        bexio_accountId: null,
        bexio_invoiceTemplateNewMembership: null,
        bexio_invoiceTemplateRenewalMembership: null,
        bexio_invoiceTitleNewMembership: 'Rechnung',
        bexio_invoiceTitleRenewalMembership: null,
        bexio_invoiceMailSubjectNewMembership: null,
        bexio_invoiceMailSubjectRenewalMembership: null,
        bexio_invoiceMailBodyNewMembership: null,
        bexio_invoiceMailBodyRenewalMembership: null,
        bexio_markInvoiceAsOpen: false,
      })
    );
  });

  it('saves the ProLitteris pixel without re-entering the password', async () => {
    const { user } = renderIntegration(
      '/integrations/tracking-pixel/edit/prolitteris'
    );
    const memberNr = 'integrations.trackingPixelSettings.prolitterisMemberNr*';

    await loaded(memberNr, '770005');
    await user.clear(getFieldByLabel(memberNr));
    await user.type(getFieldByLabel(memberNr), '770006');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(updated).toHaveBeenCalledWith({
        id: 'prolitteris',
        name: 'ProLitteris',
        prolitteris_memberNr: '770006',
        prolitteris_username: 'user@example.ch',
        prolitteris_onlyPaidContentAccess: false,
        prolitteris_usePublisherInternalKey: false,
        prolitteris_publisherInternalKeyDomain: null,
      })
    );
  });

  it('refuses a ProLitteris pixel without a member number', async () => {
    const { user } = renderIntegration(
      '/integrations/tracking-pixel/edit/prolitteris'
    );
    const memberNr = 'integrations.trackingPixelSettings.prolitterisMemberNr*';

    await loaded(memberNr, '770005');
    await user.clear(getFieldByLabel(memberNr));
    await user.click(screen.getByTestId('saveButton'));

    expect(
      await drawer().findByText('form.errors.required')
    ).toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();
  });

  it('asks for the domain instead of the login with the publisher internal key', async () => {
    const { user } = renderIntegration(
      '/integrations/tracking-pixel/edit/prolitteris'
    );
    const domain =
      'integrations.trackingPixelSettings.prolitterisPublisherInternalKeyDomain*';

    await loaded(
      'integrations.trackingPixelSettings.prolitterisUsername*',
      'user@example.ch'
    );
    expect(queryFieldByLabel(domain)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', {
        name: /prolitterisUsePublisherInternalKey/,
      })
    );
    await user.click(screen.getByTestId('saveButton'));

    expect(
      await drawer().findByText('form.errors.required')
    ).toBeInTheDocument();
    expect(
      queryFieldByLabel(
        'integrations.trackingPixelSettings.prolitterisUsername*'
      )
    ).not.toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();
  });

  it('turns the form read-only without the update permission', async () => {
    renderIntegration(
      '/integrations/payment/edit/stripe',
      sessionWith(readPermissions)
    );

    await loaded('name', 'Stripe');
    expect(getFieldByLabel('name')).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
