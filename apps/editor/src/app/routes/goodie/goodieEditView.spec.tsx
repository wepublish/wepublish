import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type FullGoodieFragment,
  type GoodieQuery,
  type UpdateGoodieMutation,
  type UpdateGoodieMutationVariables,
  GoodieDocument,
  PaymentPeriodicity,
  UpdateGoodieDocument,
} from '@wepublish/editor/api';
import {
  formHeader,
  formSectionOf,
  getFieldByLabel,
  imageFixture,
  memberPlanFixture,
  memberPlanListMock,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanCreateGoodie } from '@wepublish/permissions';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Link } from 'react-router-dom';

import { GoodieEditForm, GoodieEditView } from './goodieEditView';

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
const yearly = memberPlanFixture('plan-yearly', 'Jahresabo');
const bag = imageFixture('image-bag', 'Tasche');

const loadedGoodie: FullGoodieFragment = {
  __typename: 'Goodie',
  id: 'goodie-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Tasche',
  description: paragraph('Eine Stofftasche'),
  stock: 10,
  availableStock: 8,
  active: true,
  imageID: bag.id,
  image: bag,
  memberPlans: [
    { __typename: 'MemberPlan', id: monthly.id, name: monthly.name },
  ],
  paymentPeriodicities: [PaymentPeriodicity.Biennial],
};

const otherGoodie: FullGoodieFragment = {
  ...loadedGoodie,
  id: 'goodie-2',
  name: 'Rucksack',
  description: null,
  stock: null,
  availableStock: null,
  active: false,
  imageID: null,
  image: null,
  memberPlans: [],
  paymentPeriodicities: [],
};

const unchangedVariables = {
  id: 'goodie-1',
  name: 'Tasche',
  description: sentParagraph('Eine Stofftasche'),
  stock: 10,
  active: true,
  imageID: 'image-bag',
  memberPlanIDs: ['plan-monthly'],
  paymentPeriodicities: ['biennial'],
};

const sent = vi.fn<(variables: UpdateGoodieMutationVariables) => void>();

const goodieQuery = (
  goodie: FullGoodieFragment,
  delay = 0
): MockLink.MockedResponse => {
  const data: GoodieQuery = { __typename: 'Query', goodie };

  return {
    request: { query: GoodieDocument, variables: { id: goodie.id } },
    result: { data },
    delay,
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
};

const failingGoodieQuery: MockLink.MockedResponse = {
  request: { query: GoodieDocument, variables: { id: 'goodie-broken' } },
  result: { errors: [new GraphQLError('Goodie not found')] },
};

const updateGoodie = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: UpdateGoodieDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateGoodieMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: UpdateGoodieMutation = {
      __typename: 'Mutation',
      updateGoodie: loadedGoodie,
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
        permissions: [{ __typename: 'Permission', ...CanCreateGoodie }],
      },
    ],
  },
};

function Creator({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={creator}>{children}</AuthContext.Provider>
  );
}

function NextGoodie({ children }: { children: ReactNode }) {
  return (
    <>
      <Link
        to="/goodies/edit/goodie-2"
        data-testid="next-goodie"
      />
      {children}
    </>
  );
}

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        goodie: { form: { editTitle: 'Edit goodie «{{goodie}}»' } },
      },
    },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

type RenderOptions = {
  goodie?: FullGoodieFragment;
  errors?: readonly GraphQLError[];
  delay?: number;
  route?: string;
  wrapper?: (props: { children: ReactNode }) => ReactNode;
};

const renderEdit = ({
  goodie = loadedGoodie,
  errors,
  delay,
  route = `/goodies/edit/${goodie.id}`,
  wrapper = NextGoodie,
}: RenderOptions = {}) =>
  renderFormRoutes(
    { '/goodies/edit/:id': <GoodieEditView /> },
    {
      route,
      wrapper,
      mocks: [
        goodieQuery(goodie, delay),
        goodieQuery(otherGoodie),
        failingGoodieQuery,
        updateGoodie(errors),
        memberPlanListMock([monthly, yearly]),
      ],
    }
  );

const name = () => getFieldByLabel(/^goodie\.form\.name/);
const stock = () => getFieldByLabel(/^goodie\.form\.stock/);
const active = () =>
  screen.getByRole('checkbox', { name: /^goodie\.form\.active/ });
const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');

const loaded = async () => {
  await waitFor(() => expect(name()).toHaveValue('Tasche'));
};

beforeEach(() => {
  sent.mockClear();
});

describe('GoodieEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(GoodieEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a loading indicator until the goodie has loaded', async () => {
    renderEdit({ delay: 50 });

    expect(screen.getByText('goodie.form.editTitle')).toBeInTheDocument();
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
    renderEdit({ route: '/goodies/edit/goodie-broken' });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getByText('goodie.form.editTitle')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(queryFieldByLabel(/^goodie\.form\.name/)).toBeNull();
  });

  it('shows the loaded goodie', async () => {
    renderEdit();

    await loaded();

    expect(stock()).toHaveValue(10);
    expect(active()).toBeChecked();
    expect(
      await formSectionOf('goodie.form.sections.availability').findByText(
        'Monatsabo'
      )
    ).toBeInTheDocument();
    expect(
      await formSectionOf('goodie.form.sections.details').findByText(
        'Eine Stofftasche'
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('goodie.form.sections.media').getByRole('button', {
        name: 'chooseEditImage.removeImage',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/goodies'
    );
  });

  it('names the goodie in the title', async () => {
    renderEdit({ wrapper: Translated });

    await loaded();

    expect(
      formHeader().getByText('Edit goodie «Tasche»')
    ).toBeInTheDocument();
  });

  it('loads the other goodie when the route changes', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(screen.getByTestId('next-goodie'));

    await waitFor(() => expect(name()).toHaveValue('Rucksack'));
    expect(stock()).toHaveValue(null);
    expect(active()).not.toBeChecked();
  });

  it('saves the loaded values and stays on the goodie', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(unchangedVariables);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/goodies/edit/goodie-1');
  });

  it('saves a new name, an emptied stock and an inactive goodie', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(name());
    await user.type(name(), 'Rucksack');
    await user.clear(stock());
    await user.click(active());
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      name: 'Rucksack',
      stock: null,
      active: false,
    });
  });

  it('removes the image', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(
      screen.getByRole('button', { name: 'chooseEditImage.removeImage' })
    );
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      imageID: null,
    });
  });

  it('sends empty values of a bare goodie as null', async () => {
    const { user } = renderEdit({ route: '/goodies/edit/goodie-2' });

    await waitFor(() => expect(name()).toHaveValue('Rucksack'));
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      id: 'goodie-2',
      name: 'Rucksack',
      description: null,
      stock: null,
      active: false,
      imageID: null,
      memberPlanIDs: [],
      paymentPeriodicities: [],
    });
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/goodies'));
  });

  it('asks for a name', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(name());
    await user.click(save());

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('asks before the back link discards changes', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.type(name(), ' gross');
    await user.click(screen.getByRole('link', { name: 'back' }));

    const dialog = screen.getByRole('dialog', {
      name: 'form.view.discardChanges.title',
    });

    await user.click(
      within(dialog).getByRole('button', {
        name: 'form.view.discardChanges.keep',
      })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/goodies/edit/goodie-1');
    expect(name()).toHaveValue('Tasche gross');
  });

  it('shows a server error and keeps the entered values', async () => {
    const { user, currentPath } = renderEdit({
      errors: [new GraphQLError('The goodie could not be saved')],
    });

    await loaded();
    await user.clear(name());
    await user.type(name(), 'Rucksack');
    await user.click(save());

    expect(
      await screen.findByText('The goodie could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(name()).toHaveValue('Rucksack');
    expect(currentPath()).toBe('/goodies/edit/goodie-1');
  });

  it('refuses access without the permission to update goodies', () => {
    renderEdit({ wrapper: Creator });

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
