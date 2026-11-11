import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  DeleteMemberPlanDocument,
  MemberPlanSort,
  SortOrder,
} from '@wepublish/editor/api';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { MemberPlanList } from './memberPlanList';

// Partial mock: the list also renders components that use other Apollo hooks.
const theme = createTheme({ cssVariables: true });
vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  enqueueSnackbar: vi.fn(),
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

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

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

const lastVariables = () => mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <MemberPlanList />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
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

  it('tells the editor why a plan could not be deleted', () => {
    renderList();

    const [, options] = mockedUseMutation.mock.calls.find(
      ([document]) => document === DeleteMemberPlanDocument
    )!;
    options.onError(new Error('The plan still has sold gift codes'));

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('The plan still has sold gift codes'),
      expect.objectContaining({ variant: 'error' })
    );
  });
});
