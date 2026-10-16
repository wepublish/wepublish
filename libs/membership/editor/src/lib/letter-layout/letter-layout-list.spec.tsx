import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LetterLayoutList } from './letter-layout-list';

const layoutsQuery = vi.fn();
const deleteLayout = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown) =>
    operationName(document) === 'LetterLayouts' ? layoutsQuery() : (
      { data: undefined, loading: false }
    ),
  useMutation: (document: unknown) =>
    operationName(document) === 'DeleteLetterLayout' ?
      [deleteLayout, {}]
    : [vi.fn(), {}],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const layouts = [
  { id: 'layout-1', name: 'Briefpapier Zwölf', isDefault: true },
  { id: 'layout-2', name: 'Rechnung', isDefault: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  layoutsQuery.mockReturnValue({
    data: { letterLayouts: layouts },
    loading: false,
    refetch: vi.fn(),
  });
});

const renderList = () =>
  render(
    <MemoryRouter>
      <LetterLayoutList />
    </MemoryRouter>
  );

describe('LetterLayoutList', () => {
  it('lists the stationery and marks the default', () => {
    renderList();

    expect(screen.getByText('Briefpapier Zwölf')).toBeInTheDocument();
    expect(screen.getByText('Rechnung')).toBeInTheDocument();
    expect(screen.getAllByText('letterLayouts.default')).toHaveLength(1);
  });

  it('deletes stationery only after a confirmation', () => {
    renderList();

    fireEvent.click(screen.getAllByLabelText('delete')[1]);
    expect(deleteLayout).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'letterLayouts.deleteConfirm' })
    );

    expect(deleteLayout).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'layout-2' } })
    );
  });
});
