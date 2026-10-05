import type { Mock } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  MemberPlanSort,
  SortOrder,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';

import { MemberPlanList } from './memberPlanList';

// Partial mock: the UI library imports enums from the same module.
vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useMemberPlanListQuery: vi.fn(),
  useDeleteMemberPlanMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ?
        `${key}:${Object.values(options)
          .map(value =>
            value instanceof Date ? value.toISOString() : String(value)
          )
          .join(',')}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseMemberPlanListQuery = useMemberPlanListQuery as Mock;

const plan = {
  id: 'plan-1',
  name: 'Yearly',
  slug: 'yearly',
  active: true,
  tags: [],
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
  availablePaymentMethods: [],
};

const lastVariables = () =>
  mockedUseMemberPlanListQuery.mock.calls.at(-1)?.[0]?.variables;

const renderList = () =>
  render(
    <MemoryRouter>
      <MemberPlanList />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseMemberPlanListQuery.mockReset();
  mockedUseMemberPlanListQuery.mockReturnValue({
    data: {
      memberPlans: {
        nodes: [plan],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
  });
});

describe('MemberPlanList', () => {
  it('lists the most recently edited plans first by default', () => {
    renderList();

    expect(lastVariables()).toEqual(
      expect.objectContaining({
        sort: MemberPlanSort.ModifiedAt,
        order: SortOrder.Descending,
      })
    );
  });

  it('shows when each plan was created and last edited', async () => {
    renderList();

    expect(
      await screen.findByText(
        'memberPlanList.createdAt:2026-01-02T10:00:00.000Z'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('memberPlanList.modifiedAt:2026-09-28T15:30:00.000Z')
    ).toBeTruthy();
  });

  it('sorts by creation date when that column is chosen', async () => {
    renderList();

    fireEvent.click(await screen.findByText('memberPlanList.created'));

    expect(lastVariables()).toEqual(
      expect.objectContaining({ sort: MemberPlanSort.CreatedAt })
    );
  });
});
