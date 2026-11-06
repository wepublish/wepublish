import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  type CreateDiscountCodeMutation,
  type CreateDiscountCodeMutationVariables,
  type FullDiscountCodeFragment,
  CreateDiscountCodeDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  memberPlanFixture,
  memberPlanListMock,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanGetDiscountCode } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { DiscountCodeCreateView } from './discountCodeCreateView';

const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');
const yearly = memberPlanFixture('plan-yearly', 'Jahresabo');

const created: FullDiscountCodeFragment = {
  __typename: 'DiscountCode',
  id: 'discount-code-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  code: 'summer',
  discountPercent: 20,
  usageCount: 0,
  paidUsageCount: 0,
  validFrom: '2026-06-01T08:00:00.000Z',
  validTo: '2026-08-31T22:00:00.000Z',
  memberPlanId: monthly.id,
  memberPlan: { __typename: 'MemberPlan', id: monthly.id, name: monthly.name },
};

const createdVariables = {
  code: 'summer',
  discountPercent: 20,
  memberPlanId: 'plan-monthly',
  validFrom: '2026-06-01T08:00:00.000Z',
  validTo: '2026-08-31T22:00:00.000Z',
};

const sent = vi.fn<(variables: CreateDiscountCodeMutationVariables) => void>();

const createDiscountCode = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: CreateDiscountCodeDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateDiscountCodeMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: CreateDiscountCodeMutation = {
      __typename: 'Mutation',
      createDiscountCode: created,
    };

    return { data };
  },
});

const codeTaken = new GraphQLError(
  '\nInvalid `this.prisma.discountCode.create()` invocation in\n/app/main.js:93374:46\n\n→ 93374         return this.prisma.discountCode.create(\nUnique constraint failed on the constraint: `discountCodes_code_memberPlanId_key`'
);

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        discountCode: {
          form: { codeTaken: 'Code «{{code}}» is taken for this plan' },
        },
      },
    },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

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
        permissions: [{ __typename: 'Permission', ...CanGetDiscountCode }],
      },
    ],
  },
};

function Reader({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={reader}>{children}</AuthContext.Provider>;
}

type RenderOptions = {
  errors?: readonly GraphQLError[];
  wrapper?: (props: { children: ReactNode }) => ReactNode;
};

const renderCreate = ({ errors, wrapper }: RenderOptions = {}) =>
  renderFormRoutes(
    { '/discountCodes/create': <DiscountCodeCreateView /> },
    {
      route: '/discountCodes/create',
      wrapper,
      mocks: [
        createDiscountCode(errors),
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

const typeDate = async (user: UserEvent, input: HTMLElement, text: string) => {
  await user.click(input);
  await user.keyboard(text);
  await user.keyboard('{Escape}');
};

const pickMemberPlan = async (user: UserEvent, name: string) => {
  await user.click(memberPlan());
  await user.click(await screen.findByRole('option', { name }));
};

const replaceDiscount = async (user: UserEvent, text: string) => {
  await user.clear(discountPercent());
  await user.type(discountPercent(), text);
};

const fillIn = async (user: UserEvent, until = '31.08.2026 22:00') => {
  await user.type(code(), 'summer');
  await replaceDiscount(user, '20');
  await pickMemberPlan(user, 'Monatsabo');
  await typeDate(user, validFrom(), '01.06.2026 08:00');
  await typeDate(user, validTo(), until);
};

beforeEach(() => {
  sent.mockClear();
});

describe('DiscountCodeCreateView', () => {
  it('shows the create title, a back link to the list and both save buttons', () => {
    renderCreate();

    expect(
      screen.getByText('discountCode.form.createTitle')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/discountCodes'
    );
    expect(save()).toBeEnabled();
    expect(saveAndClose()).toBeEnabled();
  });

  it('starts with empty fields and no discount', () => {
    renderCreate();

    expect(code()).toHaveValue('');
    expect(discountPercent()).toHaveValue(0);
    expect(memberPlan()).toHaveValue('');
    expect(validFrom()).toHaveValue('');
    expect(validTo()).toHaveValue('');
  });

  it('renders its sections as regions', () => {
    renderCreate();

    const discount = formSectionOf('discountCode.form.sections.discount');
    const validity = formSectionOf('discountCode.form.sections.validity');

    expect(
      discount.getByLabelText(/^discountCode\.form\.code/, {
        selector: 'input',
      })
    ).toBe(code());
    expect(
      discount.getByLabelText(/^discountCode\.form\.discountPercent/, {
        selector: 'input',
      })
    ).toBe(discountPercent());
    expect(
      discount.getByLabelText(/^discountCode\.form\.memberPlan/, {
        selector: 'input',
      })
    ).toBe(memberPlan());
    expect(
      validity.getByLabelText(/^discountCode\.form\.validFrom/, {
        selector: 'input',
      })
    ).toBe(validFrom());
    expect(
      validity.getByLabelText(/^discountCode\.form\.validTo/, {
        selector: 'input',
      })
    ).toBe(validTo());
  });

  it('marks every field as required', () => {
    renderCreate();

    expect(getFieldByLabel('discountCode.form.code*')).toBe(code());
    expect(getFieldByLabel('discountCode.form.discountPercent*')).toBe(
      discountPercent()
    );
    expect(getFieldByLabel('discountCode.form.memberPlan*')).toBe(
      memberPlan()
    );
    expect(getFieldByLabel('discountCode.form.validFrom*')).toBe(validFrom());
    expect(getFieldByLabel('discountCode.form.validTo*')).toBe(validTo());
  });

  it('shows the code in upper case while it is typed', async () => {
    const { user } = renderCreate();

    await user.type(code(), 'summer');

    expect(code()).toHaveValue('SUMMER');
  });

  it('creates the discount code, confirms it and opens it', async () => {
    const { user, currentPath } = renderCreate();

    await fillIn(user);
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(createdVariables);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() =>
      expect(currentPath()).toBe('/discountCodes/edit/discount-code-1')
    );
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderCreate();

    await fillIn(user);
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/discountCodes'));
  });

  it('asks for a code, a subscription plan and both dates before it creates anything', async () => {
    const { user, currentPath } = renderCreate();

    await user.click(save());

    await waitFor(() =>
      expect(code()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(memberPlan()).toHaveAccessibleDescription('form.errors.required');
    expect(memberPlan()).toHaveAttribute('aria-invalid', 'true');
    expect(validFrom()).toHaveAccessibleDescription('form.errors.required');
    expect(validTo()).toHaveAccessibleDescription('form.errors.required');
    expect(sent).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/discountCodes/create');
  });

  it('asks for a code of at least three characters', async () => {
    const { user } = renderCreate();

    await user.type(code(), 'ab');
    await user.tab();

    await waitFor(() =>
      expect(code()).toHaveAccessibleDescription(
        'form.errors.too_small.string.min'
      )
    );
  });

  it('asks for a discount when it is cleared', async () => {
    const { user } = renderCreate();

    await user.clear(discountPercent());
    await user.tab();

    await waitFor(() =>
      expect(discountPercent()).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
  });

  it('rejects a discount above 100 percent', async () => {
    const { user } = renderCreate();

    await replaceDiscount(user, '101');
    await user.tab();

    await waitFor(() =>
      expect(discountPercent()).toHaveAccessibleDescription(
        'form.errors.too_big.number.inclusive'
      )
    );
  });

  it('rejects a negative discount', async () => {
    const { user } = renderCreate();

    await replaceDiscount(user, '-5');
    await user.tab();

    await waitFor(() =>
      expect(discountPercent()).toHaveAccessibleDescription(
        'form.errors.too_small.number.inclusive'
      )
    );
  });

  it('rejects an end of validity before its start', async () => {
    const { user } = renderCreate();

    await typeDate(user, validFrom(), '01.06.2026 08:00');
    await typeDate(user, validTo(), '31.05.2026 08:00');
    await user.click(save());

    await waitFor(() =>
      expect(validTo()).toHaveAccessibleDescription(
        'discountCode.form.validToBeforeValidFrom'
      )
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('accepts an end of validity at its start', async () => {
    const { user } = renderCreate();

    await fillIn(user, '01.06.2026 08:00');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...createdVariables,
      validTo: '2026-06-01T08:00:00.000Z',
    });
  });

  it('shows a code that is taken for the plan under the code field', async () => {
    const { user, currentPath } = renderCreate({
      errors: [codeTaken],
      wrapper: Translated,
    });

    await fillIn(user);
    await user.click(saveAndClose());

    await waitFor(() =>
      expect(code()).toHaveAccessibleDescription(
        'Code «SUMMER» is taken for this plan'
      )
    );
    expect(code()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/discountCodes/create');
  });

  it('shows a server error and stays on the form', async () => {
    const { user, currentPath } = renderCreate({
      errors: [new GraphQLError('The discount code could not be saved')],
    });

    await fillIn(user);
    await user.click(save());

    expect(
      await screen.findByText('The discount code could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(code()).toHaveValue('SUMMER');
    expect(currentPath()).toBe('/discountCodes/create');
  });

  it('asks before the back link discards a filled-in form', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(code(), 'summer');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/discountCodes/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/discountCodes'));
  });

  it('refuses access without the permission to create discount codes', () => {
    renderCreate({ wrapper: Reader });

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
