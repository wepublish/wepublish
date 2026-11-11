import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Currency,
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanListQuery,
  MemberPlanListQueryVariables,
  ProductType,
} from '@wepublish/editor/api';
import { ReactElement } from 'react';

import { SelectMemberPlan } from './selectMemberPlan';
import { SelectMemberPlans } from './selectMemberPlans';

const theme = createTheme({ cssVariables: true });

const plan = (index: number): FullMemberPlanFragment => ({
  __typename: 'MemberPlan',
  id: `plan-${index}`,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: `Plan ${index}`,
  description: null,
  shortDescription: null,
  slug: `plan-${index}`,
  active: true,
  productType: ProductType.Subscription,
  tags: [],
  externalReward: null,
  currency: Currency.Chf,
  extendable: true,
  maxCount: null,
  migrateToTargetPaymentMethodID: null,
  defaultPaymentPeriodicity: null,
  successPageId: null,
  failPageId: null,
  confirmationPageId: null,
  periodicityPricing: [],
  image: null,
  availablePaymentMethods: [],
});

const plans = Array.from({ length: 120 }, (_, index) => plan(index + 1));

const requests: MemberPlanListQueryVariables[] = [];

const memberPlanListMock = {
  request: { query: MemberPlanListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: MemberPlanListQueryVariables) => {
    requests.push(variables);

    const search = variables.filter?.name;
    const found =
      search ? plans.filter(item => item.name.includes(search)) : plans;
    const skip = variables.skip ?? 0;
    const take = variables.take ?? found.length;
    const data: MemberPlanListQuery = {
      __typename: 'Query',
      memberPlans: {
        __typename: 'PaginatedMemberPlans',
        nodes: found.slice(skip, skip + take),
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: skip + take < found.length,
          hasPreviousPage: skip > 0,
        },
        totalCount: found.length,
      },
    };

    return { data };
  },
};

const renderPicker = (picker: ReactElement) =>
  render(
    <ThemeProvider theme={theme}>
      <MockedProvider mocks={[memberPlanListMock]}>{picker}</MockedProvider>
    </ThemeProvider>
  );

const pageButton = (page: number) =>
  screen
    .getAllByRole('button', { name: 'listView.pagination.page' })
    .find(button => button.textContent === String(page)) as HTMLElement;

beforeEach(() => {
  requests.length = 0;
});

describe.each([
  [
    'SelectMemberPlan',
    () => (
      <SelectMemberPlan
        selectedMemberPlan={null}
        setSelectedMemberPlan={vi.fn()}
      />
    ),
  ],
  [
    'SelectMemberPlans',
    () => (
      <SelectMemberPlans
        defaultMemberPlans={[]}
        selectedMemberPlans={[]}
        setSelectedMemberPlans={vi.fn()}
      />
    ),
  ],
])('%s', (_name, picker) => {
  it('loads the plans of the page it pages to', async () => {
    const user = userEvent.setup();

    renderPicker(picker());

    await user.click(screen.getByRole('combobox'));

    await screen.findByRole('option', { name: 'Plan 1' });

    await user.click(pageButton(2));

    await screen.findByRole('option', { name: 'Plan 51' });
    expect(
      screen.queryByRole('option', { name: 'Plan 1' })
    ).not.toBeInTheDocument();
    expect(requests.at(-1)).toMatchObject({ take: 50, skip: 50 });
  });

  it('searches from the first page again', async () => {
    const user = userEvent.setup();

    renderPicker(picker());

    const input = screen.getByRole('combobox');

    await user.click(input);
    await screen.findByRole('option', { name: 'Plan 1' });
    await user.click(pageButton(2));
    await screen.findByRole('option', { name: 'Plan 51' });
    await user.type(input, 'Plan 11');

    await screen.findByRole('option', { name: 'Plan 110' });
    await waitFor(() =>
      expect(requests.at(-1)).toMatchObject({
        filter: { name: 'Plan 11' },
        take: 50,
        skip: 0,
      })
    );
  });
});

describe('SelectMemberPlan field props', () => {
  it('names the combobox after its label and shows the helper text', () => {
    renderPicker(
      <SelectMemberPlan
        label="Subscription plan"
        helperText="Please enter a subscription plan"
        error
        defaultMemberPlan={{ id: 'plan-1', name: 'Plan 1' }}
        selectedMemberPlan="plan-1"
        setSelectedMemberPlan={vi.fn()}
      />
    );

    expect(
      screen.getByRole('combobox', { name: 'Subscription plan' })
    ).toHaveValue('Plan 1');
    expect(
      screen.getByText('Please enter a subscription plan')
    ).toBeInTheDocument();
  });
});
