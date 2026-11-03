import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type CreatePaymentMethodMutation,
  type CreatePaymentMethodMutationVariables,
  type FullPaymentMethodFragment,
  type PaymentMethodListQuery,
  type PaymentProviderListQuery,
  type UpdatePaymentMethodMutation,
  type UpdatePaymentMethodMutationVariables,
  CreatePaymentMethodDocument,
  PaymentMethodDocument,
  PaymentMethodListDocument,
  PaymentProviderListDocument,
  UpdatePaymentMethodDocument,
} from '@wepublish/editor/api';
import {
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  imageFixture,
  imageListMock,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
  CanGetImage,
  CanGetImages,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { PaymentMethodList } from './paymentMethodList';

const portrait = imageFixture('image-portrait', 'Portrait');
const logo = imageFixture('image-logo', 'Logo');

const bexio = {
  __typename: 'PaymentProvider' as const,
  id: 'bexio',
  name: 'Bexio',
};
const stripe = {
  __typename: 'PaymentProvider' as const,
  id: 'stripe',
  name: 'Stripe',
};

const invoice: FullPaymentMethodFragment = {
  __typename: 'PaymentMethod',
  id: 'pm-1',
  name: 'Invoice',
  slug: 'invoice',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  gracePeriod: 14,
  paymentProvider: bexio,
  description: 'Pay by invoice',
  active: true,
  image: logo,
};

const card: FullPaymentMethodFragment = {
  __typename: 'PaymentMethod',
  id: 'pm-2',
  name: 'Card',
  slug: 'card',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  gracePeriod: 0,
  paymentProvider: stripe,
  description: '',
  active: false,
  image: null,
};

const orphan: FullPaymentMethodFragment = {
  ...card,
  id: 'pm-3',
  name: 'Orphan',
  slug: 'orphan',
  paymentProvider: null,
};

const created: FullPaymentMethodFragment = {
  ...card,
  id: 'pm-new',
  name: 'Twint Pay',
  slug: 'twint-pay',
};

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'user-role-editor',
        name: 'user-role-editor',
        description: null,
        systemRole: false,
        permissions: permissions.map(granted => ({
          __typename: 'Permission' as const,
          ...granted,
        })),
      },
    ],
  },
});

const editor = sessionWith([
  CanGetPaymentMethods,
  CanGetPaymentMethod,
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
  CanGetImages,
  CanGetImage,
]);

const listRequests = vi.fn();
const createdWith =
  vi.fn<(variables: CreatePaymentMethodMutationVariables) => void>();
const updatedWith =
  vi.fn<(variables: UpdatePaymentMethodMutationVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: PaymentMethodListDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: PaymentMethodListQuery = {
      __typename: 'Query',
      paymentMethods: [invoice, card, orphan],
    };

    return { data };
  },
};

const providerData: PaymentProviderListQuery = {
  __typename: 'Query',
  paymentProviders: [bexio, stripe],
};

const providerMock: MockLink.MockedResponse = {
  request: { query: PaymentProviderListDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: providerData },
};

const paymentMethodMock = (
  paymentMethod: FullPaymentMethodFragment
): MockLink.MockedResponse => ({
  request: { query: PaymentMethodDocument, variables: { id: paymentMethod.id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { paymentMethod } },
});

const createMock: MockLink.MockedResponse = {
  request: { query: CreatePaymentMethodDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreatePaymentMethodMutationVariables) => {
    createdWith(JSON.parse(JSON.stringify(variables)));

    const data: CreatePaymentMethodMutation = {
      __typename: 'Mutation',
      createPaymentMethod: created,
    };

    return { data };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdatePaymentMethodDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdatePaymentMethodMutationVariables) => {
    updatedWith(JSON.parse(JSON.stringify(variables)));

    const data: UpdatePaymentMethodMutation = {
      __typename: 'Mutation',
      updatePaymentMethod: {
        ...invoice,
        name: variables.name ?? invoice.name,
      },
    };

    return { data };
  },
};

const pageMocks = () => [
  listMock,
  paymentMethodMock(invoice),
  paymentMethodMock(card),
  paymentMethodMock(orphan),
  paymentMethodMock(created),
  imageListMock([portrait, logo]),
  createMock,
  updateMock,
];

const defaultMocks = () => [...pageMocks(), providerMock];

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );

const renderPaymentMethods = (
  route: string,
  {
    mocks = defaultMocks(),
    session = editor,
  }: { mocks?: MockLink.MockedResponse[]; session?: AuthContextState } = {}
) =>
  renderFormRoutes(
    {
      '/paymentmethods': <PaymentMethodList />,
      '/paymentmethods/create': <PaymentMethodList />,
      '/paymentmethods/edit/:id': <PaymentMethodList />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

type User = ReturnType<typeof renderPaymentMethods>['user'];

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameLabel = 'paymentMethodList.name*';

const nameInput = () => getFieldByLabel(nameLabel);
const slugInput = () => getFieldByLabel('paymentMethodList.slug');
const descriptionInput = () => getFieldByLabel('paymentMethodList.description');
const gracePeriodInput = () =>
  getFieldByLabel('paymentMethodEditPanel.gracePeriod*');
const activeInput = () => getFieldByLabel('paymentMethodList.active');
const providerSelect = () =>
  within(drawer()).getByRole('combobox', { name: /paymentMethodList\.adapter/ });

const paymentSection = () => formSectionOf('paymentMethodList.payment');
const imageSection = () => formSectionOf('paymentMethodList.image');

const loaded = (name = 'Invoice') =>
  waitFor(() => expect(nameInput()).toHaveValue(name));

const providersLoaded = () =>
  waitFor(() => expect(providerSelect()).not.toHaveAttribute('aria-disabled'));

const drawerHeading = (name: string) =>
  within(drawer()).getByRole('heading', { level: 2, name });

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const pickProvider = async (user: User, name: string) => {
  await providersLoaded();
  await user.click(providerSelect());
  await user.click(await screen.findByRole('option', { name }));
};

const chooseImage = async (user: User, title: string) => {
  await user.click(
    imageSection().getByRole('button', {
      name: 'chooseEditImage.chooseImage',
    })
  );
  await user.click(
    await screen.findByRole('button', { name: new RegExp(title) })
  );
  await waitFor(() =>
    expect(document.querySelectorAll('.MuiDrawer-root')).toHaveLength(1)
  );
};

beforeEach(() => {
  listRequests.mockClear();
  createdWith.mockClear();
  updatedWith.mockClear();
});

describe('PaymentMethodDrawer', () => {
  it('opens the create drawer on /paymentmethods/create', () => {
    renderPaymentMethods('/paymentmethods/create');

    expect(drawerHeading('paymentMethodList.createTitle')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(slugInput()).toHaveValue('');
    expect(slugInput()).toHaveAttribute('readonly');
    expect(descriptionInput()).toHaveValue('');
    expect(gracePeriodInput()).toHaveValue(0);
    expect(activeInput()).toBeChecked();
    expect(activeInput()).toHaveAttribute('type', 'checkbox');
    expect(providerSelect()).not.toHaveTextContent(/Bexio|Stripe/);
    expect(
      within(drawer()).getByRole('heading', {
        level: 3,
        name: 'paymentMethodList.payment',
      })
    ).toBeInTheDocument();
    expect(
      imageSection().getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
  });

  it('offers the configured payment providers in their order', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/create');

    await providersLoaded();
    await user.click(providerSelect());

    const options = await screen.findAllByRole('option');

    expect(options.map(option => option.textContent)).toEqual([
      'Bexio',
      'Stripe',
    ]);
  });

  it('disables the provider select until the providers have loaded', async () => {
    renderPaymentMethods('/paymentmethods/create', {
      mocks: [...pageMocks(), { ...providerMock, delay: 50 }],
    });

    expect(providerSelect()).toHaveAttribute('aria-disabled', 'true');

    await providersLoaded();
  });

  it('says why no provider can be picked when the providers fail to load', async () => {
    renderPaymentMethods('/paymentmethods/create', {
      mocks: [
        ...pageMocks(),
        {
          request: { query: PaymentProviderListDocument },
          error: new Error('Providers offline'),
        },
      ],
    });

    expect(
      await paymentSection().findByText('Providers offline')
    ).toBeInTheDocument();
  });

  it('follows the name with a slug', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/create');

    await user.type(nameInput(), 'Twint Pay');

    expect(slugInput()).toHaveValue('twint-pay');
  });

  it('requires a name', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/create');

    await pickProvider(user, 'Bexio');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('form.errors.required')
    ).toBeInTheDocument();
    expect(createdWith).not.toHaveBeenCalled();
  });

  it('requires a payment provider', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/create');

    await user.type(nameInput(), 'Twint Pay');
    await user.click(screen.getByTestId('saveButton'));

    expect(
      await paymentSection().findByText('form.errors.required')
    ).toBeInTheDocument();
    expect(createdWith).not.toHaveBeenCalled();
  });

  it.each([
    ['1.5', 'form.errors.invalid_type.int'],
    ['-1', 'form.errors.too_small.number.inclusive'],
    ['', 'form.errors.required'],
  ])('rejects a grace period of "%s"', async (typed, error) => {
    const { user } = renderPaymentMethods('/paymentmethods/create');

    await user.type(nameInput(), 'Twint Pay');
    await pickProvider(user, 'Bexio');
    await user.clear(gracePeriodInput());

    if (typed !== '') {
      await user.type(gracePeriodInput(), typed);
    }

    await user.click(screen.getByTestId('saveButton'));

    expect(await paymentSection().findByText(error)).toBeInTheDocument();
    expect(createdWith).not.toHaveBeenCalled();
  });

  it('creates with exact variables and the chosen image, refetches the list and stays on the new method', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/create'
    );

    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(1));
    await user.type(nameInput(), 'Twint Pay');
    await user.type(descriptionInput(), 'Mit dem Handy');
    await user.clear(gracePeriodInput());
    await user.type(gracePeriodInput(), '7');
    await user.click(activeInput());
    await pickProvider(user, 'Stripe');
    await chooseImage(user, 'Portrait');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(createdWith).toHaveBeenCalledTimes(1));
    expect(createdWith.mock.calls[0][0]).toStrictEqual({
      name: 'Twint Pay',
      slug: 'twint-pay',
      description: 'Mit dem Handy',
      active: false,
      gracePeriod: 7,
      paymentProviderID: 'stripe',
      imageId: 'image-portrait',
    });
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() =>
      expect(currentPath()).toBe('/paymentmethods/edit/pm-new')
    );
    await loaded('Twint Pay');
    expect(drawerHeading('paymentMethodList.editTitle')).toBeInTheDocument();
  });

  it('closes after save and close on create', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/create'
    );

    await user.type(nameInput(), 'Twint Pay');
    await pickProvider(user, 'Bexio');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(createdWith).toHaveBeenCalledTimes(1));
    expect(createdWith.mock.calls[0][0]).toStrictEqual({
      name: 'Twint Pay',
      slug: 'twint-pay',
      description: '',
      active: true,
      gracePeriod: 0,
      paymentProviderID: 'bexio',
      imageId: null,
    });
    await drawerClosed();
    expect(currentPath()).toBe('/paymentmethods');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('opens the stored payment method on /paymentmethods/edit/:id', async () => {
    renderPaymentMethods('/paymentmethods/edit/pm-1');

    await loaded();
    await providersLoaded();

    expect(drawerHeading('paymentMethodList.editTitle')).toBeInTheDocument();
    expect(slugInput()).toHaveValue('invoice');
    expect(descriptionInput()).toHaveValue('Pay by invoice');
    expect(gracePeriodInput()).toHaveValue(14);
    expect(activeInput()).toBeChecked();
    expect(providerSelect()).toHaveTextContent('Bexio');
    expect(imageSection().getByRole('img')).toHaveAttribute(
      'src',
      logo.previewURL
    );
  });

  it('updates with exact variables and closes after save and close', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/edit/pm-1'
    );

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toStrictEqual({
      id: 'pm-1',
      name: 'Invoice neu',
      slug: 'invoice-neu',
      description: 'Pay by invoice',
      active: true,
      gracePeriod: 14,
      paymentProviderID: 'bexio',
      imageId: 'image-logo',
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await drawerClosed();
    expect(currentPath()).toBe('/paymentmethods');
    expect(
      await screen.findByRole('link', { name: 'Invoice neu' })
    ).toBeInTheDocument();
  });

  it('stays open after save on edit', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/edit/pm-1'
    );

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/paymentmethods/edit/pm-1');
    expect(nameInput()).toHaveValue('Invoice neu');
  });

  it('clears the stored image once it was removed', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/edit/pm-1');

    await loaded();
    await user.click(
      imageSection().getByRole('button', {
        name: 'chooseEditImage.removeImage',
      })
    );
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toStrictEqual({
      id: 'pm-1',
      name: 'Invoice',
      slug: 'invoice',
      description: 'Pay by invoice',
      active: true,
      gracePeriod: 14,
      paymentProviderID: 'bexio',
      imageId: null,
    });
  });

  it('asks for a provider when the stored one is no longer configured', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/edit/pm-3');

    await loaded('Orphan');
    await providersLoaded();
    expect(providerSelect()).not.toHaveTextContent(/Bexio|Stripe/);
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveButton'));

    expect(
      await paymentSection().findByText('form.errors.required')
    ).toBeInTheDocument();
    expect(updatedWith).not.toHaveBeenCalled();
  });

  it('is read-only without CanCreatePaymentMethod', async () => {
    renderPaymentMethods('/paymentmethods/edit/pm-1', {
      session: sessionWith([CanGetPaymentMethods, CanGetPaymentMethod]),
    });

    await loaded();

    expect(
      within(drawer()).getByText('form.view.readOnly')
    ).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(gracePeriodInput()).toBeDisabled();
    expect(activeInput()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('shows no fields while the payment method loads', () => {
    renderPaymentMethods('/paymentmethods/edit/pm-1');

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('shows a load error with a retry', async () => {
    const { user } = renderPaymentMethods('/paymentmethods/edit/pm-1', {
      mocks: [
        listMock,
        providerMock,
        {
          request: { query: PaymentMethodDocument, variables: { id: 'pm-1' } },
          error: new Error('Payment method offline'),
        },
        paymentMethodMock(invoice),
      ],
    });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'form.loadError.retry' })
    );

    await loaded();
  });

  it('closes a clean drawer on Escape without asking', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/edit/pm-1'
    );

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/paymentmethods');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before the close button discards changes', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/edit/pm-1'
    );

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/paymentmethods/edit/pm-1');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/paymentmethods');
    expect(updatedWith).not.toHaveBeenCalled();
  });

  it('reopens after a close and never shows the previous payment method', async () => {
    const { user, currentPath } = renderPaymentMethods(
      '/paymentmethods/edit/pm-1'
    );

    await loaded();
    await user.keyboard('{Escape}');
    await drawerClosed();

    await user.click(await screen.findByRole('link', { name: 'Card' }));

    expect(currentPath()).toBe('/paymentmethods/edit/pm-2');
    expect(
      screen
        .queryAllByLabelText<HTMLInputElement>(nameLabel, {
          selector: 'input',
        })
        .map(input => input.value)
    ).not.toContain('Invoice');
    await loaded('Card');
    expect(activeInput()).not.toBeChecked();
  });

  it('keeps the flex chain from the drawer down to the body', async () => {
    renderPaymentMethods('/paymentmethods/edit/pm-1');

    await loaded();

    expect(drawer().querySelector('form')).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column',
      'min-height': '0',
    });
  });
});
