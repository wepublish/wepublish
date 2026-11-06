import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type CreateGoodieMutation,
  type CreateGoodieMutationVariables,
  type FullGoodieFragment,
  CreateGoodieDocument,
} from '@wepublish/editor/api';
import {
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  imageFixture,
  imageListMock,
  memberPlanFixture,
  memberPlanListMock,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanDeleteGoodie } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import type { ReactNode } from 'react';

import { GoodieCreateView } from './goodieCreateView';

const sent = vi.fn<(variables: CreateGoodieMutationVariables) => void>();

const created: FullGoodieFragment = {
  __typename: 'Goodie',
  id: 'goodie-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Tasche',
  description: null,
  stock: null,
  availableStock: null,
  active: true,
  imageID: null,
  image: null,
  memberPlans: [],
  paymentPeriodicities: [],
};

const createGoodie = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: CreateGoodieDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateGoodieMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: CreateGoodieMutation = {
      __typename: 'Mutation',
      createGoodie: created,
    };

    return { data };
  },
});

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
        permissions: [{ __typename: 'Permission', ...CanDeleteGoodie }],
      },
    ],
  },
};

function Reader({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={reader}>{children}</AuthContext.Provider>;
}

const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');
const bag = imageFixture('image-bag', 'Stofftasche');

type RenderOptions = {
  errors?: readonly GraphQLError[];
  wrapper?: (props: { children: ReactNode }) => ReactNode;
};

const renderCreate = ({ errors, wrapper }: RenderOptions = {}) =>
  renderFormRoutes(
    { '/goodies/create': <GoodieCreateView /> },
    {
      route: '/goodies/create',
      wrapper,
      mocks: [
        createGoodie(errors),
        memberPlanListMock([monthly]),
        imageListMock([bag]),
      ],
    }
  );

const name = () => getFieldByLabel(/^goodie\.form\.name/);
const stock = () => getFieldByLabel(/^goodie\.form\.stock/);
const memberPlans = () => getFieldByLabel(/^goodie\.form\.memberPlans/);
const active = () =>
  screen.getByRole('checkbox', { name: /^goodie\.form\.active/ });
const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');

const createdVariables = {
  name: 'Tasche',
  description: null,
  stock: null,
  active: true,
  imageID: null,
  memberPlanIDs: [],
  paymentPeriodicities: [],
};

beforeEach(() => {
  sent.mockClear();
});

describe('GoodieCreateView', () => {
  it('shows the create title, a back link to the list and both save buttons', () => {
    renderCreate();

    expect(screen.getByText('goodie.form.createTitle')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/goodies'
    );
    expect(save()).toBeEnabled();
    expect(saveAndClose()).toBeEnabled();
  });

  it('renders its sections as regions', () => {
    renderCreate();

    const details = formSectionOf('goodie.form.sections.details');
    const availability = formSectionOf('goodie.form.sections.availability');
    const media = formSectionOf('goodie.form.sections.media');

    expect(
      details.getByLabelText(/^goodie\.form\.name/, { selector: 'input' })
    ).toBe(name());
    expect(
      details.getByRole('group', { name: 'goodie.form.description' })
    ).toBeInTheDocument();
    expect(
      availability.getByRole('checkbox', { name: /^goodie\.form\.active/ })
    ).toBe(active());
    expect(
      availability.getByLabelText(/^goodie\.form\.memberPlans/, {
        selector: 'input',
      })
    ).toBe(memberPlans());
    expect(
      availability.getByLabelText(/^goodie\.form\.stock/, {
        selector: 'input',
      })
    ).toBe(stock());
    expect(
      media.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeInTheDocument();
  });

  it('starts empty and active, with an unlimited stock', () => {
    renderCreate();

    expect(getFieldByLabel('goodie.form.name*')).toBe(name());
    expect(name()).toBeRequired();
    expect(name()).toHaveValue('');
    expect(stock()).toHaveValue(null);
    expect(stock()).not.toBeRequired();
    expect(stock()).toHaveAttribute('placeholder', 'goodie.overview.unlimited');
    expect(active()).toBeChecked();
  });

  it('creates a goodie with the defaults and opens it', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(createdVariables);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() => expect(currentPath()).toBe('/goodies/edit/goodie-1'));
  });

  it('sends the stock, the member plans and an inactive goodie', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.type(stock(), '25');
    await user.click(active());
    await user.click(memberPlans());
    await user.click(await screen.findByRole('option', { name: 'Monatsabo' }));
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...createdVariables,
      stock: 25,
      active: false,
      memberPlanIDs: ['plan-monthly'],
    });
  });

  it('restricts the goodie to the chosen payment periodicities', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.click(getFieldByLabel(/^goodie\.form\.paymentPeriodicities/));
    await user.click(
      await screen.findByRole('option', {
        name: 'memberPlanList.paymentPeriodicity.biennial',
      })
    );
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...createdVariables,
      paymentPeriodicities: ['biennial'],
    });
  });

  it('sends the chosen image', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.click(
      formSectionOf('goodie.form.sections.media').getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    );
    await user.click(
      await screen.findByRole('button', { name: /Stofftasche/ })
    );
    await drawerClosed();
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...createdVariables,
      imageID: 'image-bag',
    });
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/goodies'));
  });

  it('asks for a name before creating a goodie', async () => {
    const { user, currentPath } = renderCreate();

    await user.click(save());

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(name()).toHaveAttribute('aria-invalid', 'true');
    expect(sent).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/goodies/create');
  });

  it('rejects a negative stock under the field', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.type(stock(), '-1');
    await user.click(save());

    await waitFor(() =>
      expect(stock()).toHaveAccessibleDescription(
        'form.errors.too_small.number.inclusive'
      )
    );
    expect(stock()).toHaveAttribute('aria-invalid', 'true');
    expect(sent).not.toHaveBeenCalled();
  });

  it('shows a server error and stays on the form', async () => {
    const { user, currentPath } = renderCreate({
      errors: [new GraphQLError('The goodie could not be saved')],
    });

    await user.type(name(), 'Tasche');
    await user.click(save());

    expect(
      await screen.findByText('The goodie could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(name()).toHaveValue('Tasche');
    expect(currentPath()).toBe('/goodies/create');
  });

  it('asks before the back link discards a filled-in form', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Tasche');
    await user.click(screen.getByRole('link', { name: 'back' }));

    const dialog = screen.getByRole('dialog', {
      name: 'form.view.discardChanges.title',
    });

    expect(currentPath()).toBe('/goodies/create');

    await user.click(
      within(dialog).getByRole('button', {
        name: 'form.view.discardChanges.discard',
      })
    );

    await waitFor(() => expect(currentPath()).toBe('/goodies'));
  });

  it('refuses access without the permission to create goodies', () => {
    renderCreate({ wrapper: Reader });

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
