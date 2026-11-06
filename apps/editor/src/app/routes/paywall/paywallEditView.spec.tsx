import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type FullPaywallFragment,
  type PaywallQuery,
  type UpdatePaywallMutation,
  type UpdatePaywallMutationVariables,
  type WebsiteSettingsQuery,
  PaywallDocument,
  UpdatePaywallDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  memberPlanFixture,
  memberPlanListMock,
  paywallFixture,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanCreatePaywall } from '@wepublish/permissions';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { PaywallEditForm, PaywallEditView } from './paywallEditView';

const keyDisabled = {
  __typename: 'KeyEnabled',
  enabled: false,
  key: null,
} as const;

const websiteSettingsData: WebsiteSettingsQuery = {
  __typename: 'Query',
  websiteSettings: {
    __typename: 'WebsiteSettings',
    theme: {},
    analytics: {
      __typename: 'WebsiteAnalytics',
      googleAnalytics: keyDisabled,
      googleTagManager: keyDisabled,
      plausible: keyDisabled,
      piwik: keyDisabled,
    },
    mail: { __typename: 'WebsiteMail', mailchimp: null },
    ads: { __typename: 'WebsiteAds', sparkLoop: keyDisabled },
    fonts: [],
  },
};

const websiteSettings: MockLink.MockedResponse = {
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: { data: websiteSettingsData },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const paragraph = (text: string): RichtextJSONDocument => ({
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text }],
    },
  ],
});

const sentParagraph = (text: string) => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', text }],
    },
  ],
});

const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');

const loadedPaywall: FullPaywallFragment = {
  ...paywallFixture('paywall-1', 'Premium'),
  description: paragraph('Nur mit Abo'),
  circumventDescription: paragraph('Drei Absätze gratis'),
  upgradeDescription: paragraph('Jetzt auf das Jahresabo wechseln'),
  upgradeCircumventDescription: paragraph('Mit dem Jahresabo werbefrei lesen'),
  active: true,
  anyMemberPlan: false,
  alternativeSubscribeUrl: 'https://example.com/abo',
  fadeout: true,
  hideContentAfter: 4,
  memberPlans: [
    { __typename: 'MemberPlan', id: monthly.id, name: monthly.name },
  ],
  bypasses: [
    { __typename: 'PaywallBypass', id: 'bypass-1', token: 'print-2026' },
    { __typename: 'PaywallBypass', id: 'bypass-2', token: 'event-2026' },
  ],
};

const otherPaywall: FullPaywallFragment = {
  ...paywallFixture('paywall-2', 'Basic'),
  anyMemberPlan: true,
};

const unchangedVariables = {
  id: 'paywall-1',
  name: 'Premium',
  description: sentParagraph('Nur mit Abo'),
  circumventDescription: sentParagraph('Drei Absätze gratis'),
  upgradeDescription: sentParagraph('Jetzt auf das Jahresabo wechseln'),
  upgradeCircumventDescription: sentParagraph(
    'Mit dem Jahresabo werbefrei lesen'
  ),
  active: true,
  anyMemberPlan: false,
  memberPlanIds: ['plan-monthly'],
  alternativeSubscribeUrl: 'https://example.com/abo',
  hideContentAfter: 4,
  fadeout: true,
  bypassTokens: ['print-2026', 'event-2026'],
};

const sent = vi.fn<(variables: UpdatePaywallMutationVariables) => void>();

const paywallQuery = (
  paywall: FullPaywallFragment,
  delay = 0
): MockLink.MockedResponse => {
  const data: PaywallQuery = { __typename: 'Query', paywall };

  return {
    request: { query: PaywallDocument, variables: { id: paywall.id } },
    result: { data },
    delay,
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
};

const failingPaywallQuery: MockLink.MockedResponse = {
  request: { query: PaywallDocument, variables: { id: 'paywall-broken' } },
  result: { errors: [new GraphQLError('Paywall not found')] },
};

const updatePaywall = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: UpdatePaywallDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdatePaywallMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: UpdatePaywallMutation = {
      __typename: 'Mutation',
      updatePaywall: loadedPaywall,
    };

    return { data };
  },
});

const creator: AuthContextState = {
  session: {
    email: 'creator@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'creator',
        name: 'creator',
        description: null,
        systemRole: false,
        permissions: [{ __typename: 'Permission', ...CanCreatePaywall }],
      },
    ],
  },
};

function Creator({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={creator}>{children}</AuthContext.Provider>
  );
}

function NextPaywall({ children }: { children: ReactNode }) {
  return (
    <>
      <Link
        to="/articles/paywalls/edit/paywall-2"
        data-testid="next-paywall"
      />
      {children}
    </>
  );
}

type RenderOptions = {
  paywall?: FullPaywallFragment;
  errors?: readonly GraphQLError[];
  delay?: number;
  route?: string;
  wrapper?: (props: { children: ReactNode }) => ReactNode;
};

const renderEdit = ({
  paywall = loadedPaywall,
  errors,
  delay,
  route = `/articles/paywalls/edit/${paywall.id}`,
  wrapper = NextPaywall,
}: RenderOptions = {}) =>
  renderFormRoutes(
    { '/articles/paywalls/edit/:id': <PaywallEditView /> },
    {
      route,
      wrapper,
      mocks: [
        websiteSettings,
        paywallQuery(paywall, delay),
        paywallQuery(otherPaywall),
        failingPaywallQuery,
        updatePaywall(errors),
        memberPlanListMock([monthly]),
      ],
    }
  );

const name = () => getFieldByLabel(/^paywall\.form\.name/);
const alternativeUrl = () =>
  getFieldByLabel(/^paywall\.form\.alternativeSubscribeUrl/);
const hideContentAfter = () =>
  getFieldByLabel(/^paywall\.form\.hideContentAfter/);
const tokens = () =>
  screen.queryAllByLabelText<HTMLInputElement>(/^paywall\.form\.bypassToken/, {
    selector: 'input',
  });
const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');

const loaded = async () => {
  await waitFor(() => expect(name()).toHaveValue('Premium'));
};

beforeEach(() => {
  sent.mockClear();
});

describe('PaywallEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(PaywallEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a loading indicator until the paywall has loaded', async () => {
    renderEdit({ delay: 50 });

    expect(screen.getByText('paywall.form.editTitle')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(saveAndClose()).toBeDisabled();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('region')).toHaveLength(0);

    await loaded();

    expect(save()).toBeEnabled();
    expect(saveAndClose()).toBeEnabled();
  });

  it('explains a failed load instead of showing an empty form', async () => {
    renderEdit({ route: '/articles/paywalls/edit/paywall-broken' });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getByText('paywall.form.editTitle')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(queryFieldByLabel(/^paywall\.form\.name/)).toBeNull();
  });

  it('shows the loaded paywall', async () => {
    const { user } = renderEdit();

    await loaded();

    expect(
      screen.getByRole('checkbox', { name: /^paywall\.form\.active/ })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /^paywall\.form\.anyMemberPlan/ })
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /^paywall\.form\.fadeout/ })
    ).toBeChecked();
    expect(alternativeUrl()).toHaveValue('https://example.com/abo');
    expect(hideContentAfter()).toHaveValue(4);
    expect(tokens().map(token => token.value)).toEqual([
      'print-2026',
      'event-2026',
    ]);
    expect(
      await formSectionOf('paywall.form.sections.texts').findByText(
        'Nur mit Abo'
      )
    ).toBeInTheDocument();
    expect(
      await formSectionOf('paywall.form.sections.texts').findByText(
        'Drei Absätze gratis'
      )
    ).toBeInTheDocument();

    await user.click(
      formSectionOf('paywall.form.upgrade').getByRole('button', {
        name: /^paywall\.form\.upgrade/,
      })
    );

    expect(
      await formSectionOf('paywall.form.upgrade').findByText(
        'Jetzt auf das Jahresabo wechseln'
      )
    ).toBeInTheDocument();
    expect(
      await formSectionOf('paywall.form.upgrade').findByText(
        'Mit dem Jahresabo werbefrei lesen'
      )
    ).toBeInTheDocument();
  });

  it('loads the other paywall when the route changes', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(screen.getByTestId('next-paywall'));

    await waitFor(() => expect(name()).toHaveValue('Basic'));
    expect(tokens()).toHaveLength(0);
  });

  it('saves the loaded values and stays on the paywall', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(unchangedVariables);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/articles/paywalls/edit/paywall-1');
  });

  it('saves a new name, an emptied alternative URL and fewer visible blocks', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(name());
    await user.type(name(), 'Premium plus');
    await user.clear(alternativeUrl());
    await user.clear(hideContentAfter());
    await user.type(hideContentAfter(), '2');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      name: 'Premium plus',
      alternativeSubscribeUrl: null,
      hideContentAfter: 2,
    });
  });

  it('removes a bypass token', async () => {
    const { user } = renderEdit();

    await loaded();

    const [printRow] = screen.getAllByRole('listitem');

    await user.click(
      within(printRow).getByRole('button', { name: 'form.array.remove' })
    );
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      bypassTokens: ['event-2026'],
    });
  });

  it('shows the QR code of a token', async () => {
    const { user } = renderEdit();

    await loaded();

    const [printRow] = screen.getAllByRole('listitem');

    await user.click(
      within(printRow).getByRole('button', { name: 'paywall.form.showQrCode' })
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'paywall.form.qrCodeTitle',
    });

    expect(
      within(dialog).getByText('https://example.com/?key=print-2026')
    ).toBeInTheDocument();
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/articles/paywalls'));
  });

  it('links back to the list', async () => {
    renderEdit();

    await loaded();

    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/articles/paywalls'
    );
  });

  it('asks before the back link discards changes', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.type(name(), ' plus');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/articles/paywalls/edit/paywall-1');
    expect(name()).toHaveValue('Premium plus');
  });

  it('shows a server error and keeps the entered values', async () => {
    const { user, currentPath } = renderEdit({
      errors: [new GraphQLError('The paywall could not be saved')],
    });

    await loaded();
    await user.clear(name());
    await user.type(name(), 'Premium plus');
    await user.click(save());

    expect(
      await screen.findByText('The paywall could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(name()).toHaveValue('Premium plus');
    expect(currentPath()).toBe('/articles/paywalls/edit/paywall-1');
  });

  it('refuses access without the permission to update paywalls', () => {
    renderEdit({ wrapper: Creator });

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
