import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type CreatePaywallMutation,
  type CreatePaywallMutationVariables,
  type FullPaywallFragment,
  type WebsiteSettingsQuery,
  CreatePaywallDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  memberPlanFixture,
  memberPlanListMock,
  paywallFixture,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanDeletePaywall } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { PaywallCreateView } from './paywallCreateView';

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

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        paywall: { form: { nameTaken: 'Paywall «{{name}}» is taken' } },
      },
    },
  },
});

const sent = vi.fn<(variables: CreatePaywallMutationVariables) => void>();

const created: FullPaywallFragment = {
  ...paywallFixture('paywall-1', 'Premium'),
  anyMemberPlan: false,
  fadeout: true,
  hideContentAfter: 3,
};

const createPaywall = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: CreatePaywallDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreatePaywallMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: CreatePaywallMutation = {
      __typename: 'Mutation',
      createPaywall: created,
    };

    return { data };
  },
});

const nameTaken = new GraphQLError(
  '\nInvalid `this.prisma.paywall.create()` invocation in\n/app/main.js:93374:46\n\n→ 93374         return yield this.prisma.paywall.create(\nUnique constraint failed on the constraint: `paywalls_name_key`'
);

const reader: AuthContextState = {
  session: {
    email: 'reader@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'reader',
        name: 'reader',
        description: null,
        systemRole: false,
        permissions: [{ __typename: 'Permission', ...CanDeletePaywall }],
      },
    ],
  },
};

function Reader({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={reader}>{children}</AuthContext.Provider>;
}

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');

type RenderOptions = {
  errors?: readonly GraphQLError[];
  wrapper?: (props: { children: ReactNode }) => ReactNode;
};

const renderCreate = ({ errors, wrapper }: RenderOptions = {}) =>
  renderFormRoutes(
    { '/articles/paywalls/create': <PaywallCreateView /> },
    {
      route: '/articles/paywalls/create',
      wrapper,
      mocks: [
        websiteSettings,
        createPaywall(errors),
        memberPlanListMock([monthly]),
      ],
    }
  );

const name = () => getFieldByLabel(/^paywall\.form\.name/);
const alternativeUrl = () =>
  getFieldByLabel(/^paywall\.form\.alternativeSubscribeUrl/);
const hideContentAfter = () =>
  getFieldByLabel(/^paywall\.form\.hideContentAfter/);
const memberPlans = () => getFieldByLabel(/^paywall\.form\.memberPlans/);
const anyMemberPlan = () =>
  screen.getByRole('checkbox', { name: /^paywall\.form\.anyMemberPlan/ });
const tokens = () =>
  screen.queryAllByLabelText<HTMLInputElement>(/^paywall\.form\.bypassToken/, {
    selector: 'input',
  });
const qrButtons = () =>
  screen.queryAllByRole('button', { name: 'paywall.form.showQrCode' });
const addToken = () =>
  screen.getByRole('button', { name: 'paywall.form.addBypass' });
const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');

const createdVariables = {
  name: 'Premium',
  description: null,
  circumventDescription: null,
  upgradeDescription: null,
  upgradeCircumventDescription: null,
  active: true,
  anyMemberPlan: false,
  memberPlanIds: [],
  alternativeSubscribeUrl: null,
  hideContentAfter: 3,
  fadeout: true,
  bypassTokens: [],
};

beforeEach(() => {
  sent.mockClear();
});

describe('PaywallCreateView', () => {
  it('shows the create title, a back link to the list and both save buttons', () => {
    renderCreate();

    expect(screen.getByText('paywall.form.createTitle')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/articles/paywalls'
    );
    expect(save()).toBeEnabled();
    expect(saveAndClose()).toBeEnabled();
  });

  it('renders its sections as regions', () => {
    renderCreate();

    const general = formSectionOf('paywall.form.sections.general');
    const texts = formSectionOf('paywall.form.sections.texts');
    const access = formSectionOf('paywall.form.sections.access');
    const display = formSectionOf('paywall.form.display');

    expect(
      general.getByLabelText(/^paywall\.form\.name/, { selector: 'input' })
    ).toBe(name());
    expect(
      general.getByRole('checkbox', { name: /^paywall\.form\.active/ })
    ).toBeChecked();
    expect(
      texts.getByRole('group', { name: 'paywall.form.description' })
    ).toBeInTheDocument();
    expect(
      texts.getByRole('group', { name: 'paywall.form.circumventDescription' })
    ).toBeInTheDocument();
    expect(
      formSectionOf('paywall.form.bypasses').getByText(
        'paywall.form.bypassesInfo'
      )
    ).toBeInTheDocument();
    expect(
      access.getByRole('checkbox', { name: /^paywall\.form\.anyMemberPlan/ })
    ).not.toBeChecked();
    expect(
      access.getByLabelText(/^paywall\.form\.memberPlans/, {
        selector: 'input',
      })
    ).toBe(memberPlans());
    expect(
      access.getByLabelText(/^paywall\.form\.alternativeSubscribeUrl/, {
        selector: 'input',
      })
    ).toBe(alternativeUrl());
    expect(
      display.getByLabelText(/^paywall\.form\.hideContentAfter/, {
        selector: 'input',
      })
    ).toHaveValue(3);
    expect(
      display.getByRole('checkbox', { name: /^paywall\.form\.fadeout/ })
    ).toBeChecked();
  });

  it('keeps the upgrade texts in a closed section with their own labels', async () => {
    const { user } = renderCreate();

    const toggle = within(
      screen.getByRole('region', { name: 'paywall.form.upgrade' })
    ).getByRole('button', { name: 'paywall.form.upgrade' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('group', { name: 'paywall.form.upgradeDescription' })
    ).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      formSectionOf('paywall.form.upgrade').getByRole('group', {
        name: 'paywall.form.upgradeDescription',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('paywall.form.upgrade').getByRole('group', {
        name: 'paywall.form.upgradeCircumventDescription',
      })
    ).toBeInTheDocument();
  });

  it('creates a paywall with the defaults and opens it', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Premium');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(createdVariables);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() =>
      expect(currentPath()).toBe('/articles/paywalls/edit/paywall-1')
    );
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Premium');
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/articles/paywalls'));
  });

  it('asks for a name before creating a paywall', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), '   ');
    await user.click(save());

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(sent).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/articles/paywalls/create');
  });

  it('rejects an invalid alternative URL and sends an empty one as null', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Premium');
    await user.type(alternativeUrl(), 'not a url');
    await user.click(save());

    await waitFor(() =>
      expect(alternativeUrl()).toHaveAccessibleDescription(
        'form.errors.invalid_format.url'
      )
    );
    expect(alternativeUrl()).toHaveAttribute('aria-invalid', 'true');
    expect(sent).not.toHaveBeenCalled();

    await user.clear(alternativeUrl());
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0].alternativeSubscribeUrl).toBeNull();
  });

  it('sends the number of visible blocks', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Premium');
    await user.clear(hideContentAfter());
    await user.type(hideContentAfter(), '5');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...createdVariables,
      hideContentAfter: 5,
    });
  });

  it('rejects a negative number of visible blocks', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Premium');
    await user.clear(hideContentAfter());
    await user.type(hideContentAfter(), '-1');
    await user.click(save());

    await waitFor(() =>
      expect(hideContentAfter()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('locks the member plans while any subscription passes', async () => {
    const { user } = renderCreate();

    expect(memberPlans()).toBeEnabled();

    await user.click(anyMemberPlan());

    await waitFor(() => expect(memberPlans()).toBeDisabled());
  });

  it('sends each bypass token once', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Premium');
    await user.click(addToken());
    await user.type(tokens()[0], 'print-2026');
    await user.click(addToken());
    await user.type(tokens()[1], 'event-2026');
    await user.click(addToken());
    await user.type(tokens()[2], ' print-2026 ');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...createdVariables,
      bypassTokens: ['print-2026', 'event-2026'],
    });
  });

  it('asks for a token in every bypass row', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Premium');
    await user.click(addToken());
    await user.click(save());

    await waitFor(() =>
      expect(tokens()[0]).toHaveAccessibleDescription('form.errors.required')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('offers the QR code only for a token that is filled in', async () => {
    const { user } = renderCreate();

    await user.click(addToken());

    expect(qrButtons()).toHaveLength(1);
    expect(qrButtons()[0]).toBeDisabled();

    await user.type(tokens()[0], 'print-2026');

    await waitFor(() => expect(qrButtons()[0]).toBeEnabled());
  });

  it('shows a taken name under the name field', async () => {
    const { user, currentPath } = renderCreate({
      errors: [nameTaken],
      wrapper: Translated,
    });

    await user.type(name(), 'Premium');
    await user.click(saveAndClose());

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('Paywall «Premium» is taken')
    );
    expect(name()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Paywall «Premium» is taken')).toHaveLength(1);
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/articles/paywalls/create');
  });

  it('shows a server error and stays on the form', async () => {
    const { user, currentPath } = renderCreate({
      errors: [new GraphQLError('The paywall could not be saved')],
    });

    await user.type(name(), 'Premium');
    await user.click(save());

    expect(
      await screen.findByText('The paywall could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(name()).toHaveValue('Premium');
    expect(currentPath()).toBe('/articles/paywalls/create');
  });

  it('asks before the back link discards a filled-in form', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Premium');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/articles/paywalls/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/articles/paywalls'));
  });

  it('refuses access without the permission to create paywalls', () => {
    renderCreate({ wrapper: Reader });

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
