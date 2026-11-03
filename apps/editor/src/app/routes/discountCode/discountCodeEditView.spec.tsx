import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  type DiscountCodeQuery,
  type FullDiscountCodeFragment,
  type UpdateDiscountCodeMutation,
  type UpdateDiscountCodeMutationVariables,
  DiscountCodeDocument,
  UpdateDiscountCodeDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  memberPlanFixture,
  memberPlanListMock,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanCreateDiscountCode } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Link } from 'react-router-dom';

import { DiscountCodeEditView } from './discountCodeEditView';

const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');
const yearly = memberPlanFixture('plan-yearly', 'Jahresabo');

const loadedDiscountCode: FullDiscountCodeFragment = {
  __typename: 'DiscountCode',
  id: 'discount-code-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  code: 'summer',
  discountPercent: 20,
  usageCount: 3,
  paidUsageCount: 1,
  validFrom: '2026-06-01T08:00:00.000Z',
  validTo: '2026-08-31T22:00:00.000Z',
  memberPlanId: monthly.id,
  memberPlan: { __typename: 'MemberPlan', id: monthly.id, name: monthly.name },
};

const otherDiscountCode: FullDiscountCodeFragment = {
  ...loadedDiscountCode,
  id: 'discount-code-2',
  code: 'winter',
  discountPercent: 50,
  memberPlanId: yearly.id,
  memberPlan: { __typename: 'MemberPlan', id: yearly.id, name: yearly.name },
};

const unchangedVariables = {
  id: 'discount-code-1',
  code: 'summer',
  discountPercent: 20,
  memberPlanId: 'plan-monthly',
  validFrom: '2026-06-01T08:00:00.000Z',
  validTo: '2026-08-31T22:00:00.000Z',
};

const sent = vi.fn<(variables: UpdateDiscountCodeMutationVariables) => void>();

const discountCodeQuery = (
  discountCode: FullDiscountCodeFragment,
  delay = 0
): MockLink.MockedResponse => {
  const data: DiscountCodeQuery = { __typename: 'Query', discountCode };

  return {
    request: {
      query: DiscountCodeDocument,
      variables: { id: discountCode.id },
    },
    result: { data },
    delay,
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
};

const failingDiscountCodeQuery: MockLink.MockedResponse = {
  request: {
    query: DiscountCodeDocument,
    variables: { id: 'discount-code-broken' },
  },
  result: { errors: [new GraphQLError('Discount code not found')] },
};

const updateDiscountCode = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: UpdateDiscountCodeDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateDiscountCodeMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: UpdateDiscountCodeMutation = {
      __typename: 'Mutation',
      updateDiscountCode: loadedDiscountCode,
    };

    return { data };
  },
});

const codeTaken = new GraphQLError(
  '\nInvalid `this.prisma.discountCode.update()` invocation in\n/app/main.js:93374:46\n\n→ 93374         return this.prisma.discountCode.update(\nUnique constraint failed on the constraint: `discountCodes_code_memberPlanId_key`'
);

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        discountCode: {
          form: {
            editTitle: 'Edit «{{ discountCode }}»',
            codeTaken: 'Code «{{code}}» is taken for this plan',
          },
        },
      },
    },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

function NextDiscountCode({ children }: { children: ReactNode }) {
  return (
    <>
      <Link
        to="/discountCodes/edit/discount-code-2"
        data-testid="next-discount-code"
      />
      {children}
    </>
  );
}

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
        permissions: [{ __typename: 'Permission', ...CanCreateDiscountCode }],
      },
    ],
  },
};

function Creator({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={creator}>{children}</AuthContext.Provider>
  );
}

type RenderOptions = {
  errors?: readonly GraphQLError[];
  delay?: number;
  route?: string;
  wrapper?: (props: { children: ReactNode }) => ReactNode;
};

const renderEdit = ({
  errors,
  delay,
  route = '/discountCodes/edit/discount-code-1',
  wrapper = NextDiscountCode,
}: RenderOptions = {}) =>
  renderFormRoutes(
    { '/discountCodes/edit/:id': <DiscountCodeEditView /> },
    {
      route,
      wrapper,
      mocks: [
        discountCodeQuery(loadedDiscountCode, delay),
        discountCodeQuery(otherDiscountCode),
        failingDiscountCodeQuery,
        updateDiscountCode(errors),
        memberPlanListMock([monthly, yearly]),
      ],
    }
  );

const code = () => getFieldByLabel(/^discountCode\.form\.code/);
const discountPercent = () =>
  getFieldByLabel(/^discountCode\.form\.discountPercent/);
const memberPlan = () => getFieldByLabel(/^discountCode\.form\.memberPlan/);
const validFrom = () => getFieldByLabel(/^discountCode\.form\.validFrom/);
const validTo = () => getFieldByLabel(/^discountCode\.form\.validTo/);
const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');

const loaded = async () => {
  await waitFor(() => expect(code()).toHaveValue('SUMMER'));
};

const pickMemberPlan = async (user: UserEvent, name: string) => {
  await user.clear(memberPlan());
  await user.type(memberPlan(), name);
  await user.click(await screen.findByRole('option', { name }));
};

beforeEach(() => {
  sent.mockClear();
});

describe('DiscountCodeEditView', () => {
  it('shows the header and a loading indicator until the discount code has loaded', async () => {
    renderEdit({ delay: 50 });

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
    renderEdit({ route: '/discountCodes/edit/discount-code-broken' });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(queryFieldByLabel(/^discountCode\.form\.code/)).toBeNull();
  });

  it('shows the loaded discount code in its sections', async () => {
    renderEdit();

    await loaded();

    expect(discountPercent()).toHaveValue(20);
    expect(validFrom()).toHaveValue('01.06.2026 08:00');
    expect(validTo()).toHaveValue('31.08.2026 22:00');
    await waitFor(() => expect(memberPlan()).toHaveValue('Monatsabo'));
    expect(
      formSectionOf('discountCode.form.sections.discount').getByLabelText(
        /^discountCode\.form\.code/,
        { selector: 'input' }
      )
    ).toBe(code());
    expect(
      formSectionOf('discountCode.form.sections.validity').getByLabelText(
        /^discountCode\.form\.validTo/,
        { selector: 'input' }
      )
    ).toBe(validTo());
  });

  it('names the code in the title as it is shown', async () => {
    renderEdit({ wrapper: Translated });

    await loaded();

    expect(screen.getByText('Edit «SUMMER»')).toBeInTheDocument();
  });

  it('loads the other discount code when the route changes', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(screen.getByTestId('next-discount-code'));

    await waitFor(() => expect(code()).toHaveValue('WINTER'));
    expect(discountPercent()).toHaveValue(50);
  });

  it('saves the loaded values, confirms it and stays on the discount code', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(unchangedVariables);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/discountCodes/edit/discount-code-1');
  });

  it('saves a new code, discount and subscription plan', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(code());
    await user.type(code(), 'Autumn');
    await user.clear(discountPercent());
    await user.type(discountPercent(), '35');
    await pickMemberPlan(user, 'Jahresabo');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      code: 'autumn',
      discountPercent: 35,
      memberPlanId: 'plan-yearly',
    });
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/discountCodes'));
  });

  it('links back to the list', async () => {
    renderEdit();

    await loaded();

    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/discountCodes'
    );
  });

  it('shows a code that is taken for the plan under the code field', async () => {
    const { user, currentPath } = renderEdit({
      errors: [codeTaken],
      wrapper: Translated,
    });

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() =>
      expect(code()).toHaveAccessibleDescription(
        'Code «SUMMER» is taken for this plan'
      )
    );
    expect(currentPath()).toBe('/discountCodes/edit/discount-code-1');
  });

  it('shows a server error and keeps the entered values', async () => {
    const { user, currentPath } = renderEdit({
      errors: [new GraphQLError('The discount code could not be saved')],
    });

    await loaded();
    await user.clear(discountPercent());
    await user.type(discountPercent(), '35');
    await user.click(save());

    expect(
      await screen.findByText('The discount code could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(discountPercent()).toHaveValue(35);
    expect(currentPath()).toBe('/discountCodes/edit/discount-code-1');
  });

  it('refuses access without the permission to update discount codes', () => {
    renderEdit({ wrapper: Creator });

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
