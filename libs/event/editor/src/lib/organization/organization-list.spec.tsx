import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DeleteOrganizationDocument,
  EditorOrganizationListDocument,
  OrganizationSort,
  SortOrder,
} from '@wepublish/editor/api';
import {
  CanCreateOrganization,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { OrganizationList } from './organization-list';
import { testOrganizationListItem } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const MEMBER = [CanUpdateOrganization.id];
const READER = [CanGetOtherOrganizations.id];
const AGENDA_ADMIN = [
  CanCreateOrganization.id,
  CanUpdateOrganization.id,
  CanUpdateOtherOrganizations.id,
];

let organizations = [testOrganizationListItem()];
const deleteOrganization = vi.fn();
const refetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  organizations = [testOrganizationListItem()];
  deleteOrganization.mockReset().mockResolvedValue({ data: {} });
  refetch.mockReset();
  mockedUseQuery.mockReset().mockImplementation(() => ({
    data: {
      organizations: { nodes: organizations, totalCount: organizations.length },
    },
    loading: false,
    refetch,
  }));
  mockedUseMutation.mockImplementation(document => [
    document === DeleteOrganizationDocument ? deleteOrganization : vi.fn(),
    { loading: false },
  ]);
});

const renderList = (permissions = AGENDA_ADMIN) =>
  render(renderWith(<OrganizationList />, { permissions }));

const openFilters = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'filterableList.filter.label' })
  );

const lastVariables = () =>
  mockedUseQuery.mock.calls
    .filter(([document]) => document === EditorOrganizationListDocument)
    .at(-1)?.[1]?.variables;

describe('OrganizationList', () => {
  it('lists every organisation by name for a cross-organisation holder', () => {
    renderList();

    expect(lastVariables()).toEqual({
      filter: {},
      take: 10,
      skip: 0,
      sort: OrganizationSort.Name,
      order: SortOrder.Ascending,
    });
    expect(screen.getByRole('link', { name: 'Equilibre' })).toHaveAttribute(
      'href',
      '/organizations/edit/org-1'
    );
  });

  it('shows a member their own organisations unless they switch the toggle off', () => {
    renderList(MEMBER);
    openFilters();

    expect(lastVariables().filter).toEqual({ mine: true });

    fireEvent.click(
      screen.getByRole('switch', { name: 'agenda.organizations.filter.mine' })
    );

    expect(lastVariables().filter).toEqual({ mine: false });
  });

  it('marks memberless organisations for holders of a cross-organisation permission', () => {
    organizations = [
      testOrganizationListItem({ members: [] }),
      testOrganizationListItem({
        id: 'org-2',
        name: 'Dampfzentrale',
        createdByMigration: true,
        partner: true,
      }),
    ];
    renderList(READER);
    openFilters();

    expect(
      screen.getByText('agenda.organizations.markers.noMembers')
    ).toBeInTheDocument();
    expect(
      screen.getByText('agenda.organizations.markers.migrated')
    ).toBeInTheDocument();
    expect(
      screen.getByText('agenda.organizations.markers.partner')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: 'agenda.organizations.filter.members',
      })
    ).toBeInTheDocument();
  });

  it('filters for organisations without members', () => {
    renderList(READER);
    openFilters();

    fireEvent.mouseDown(
      screen.getByRole('combobox', {
        name: 'agenda.organizations.filter.members',
      })
    );
    fireEvent.click(
      screen.getByRole('option', {
        name: 'agenda.organizations.filter.membersNone',
      })
    );

    expect(lastVariables().filter).toEqual({ hasMembers: false });
  });

  it('shows neither the markers nor their filters without a cross-organisation permission', () => {
    organizations = [
      testOrganizationListItem({ members: [], createdByMigration: true }),
    ];
    renderList(MEMBER);
    openFilters();

    expect(
      screen.queryByText('agenda.organizations.markers.noMembers')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', {
        name: 'agenda.organizations.filter.members',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', {
        name: 'agenda.organizations.filter.migrated',
      })
    ).not.toBeInTheDocument();
  });

  it('shows no sensitive markers on rows of the public type', () => {
    organizations = [
      testOrganizationListItem({
        __typename: 'Organization',
        members: undefined,
        partner: undefined,
        createdByMigration: undefined,
      }),
    ];
    renderList(READER);

    expect(
      screen.queryByText('agenda.organizations.markers.noMembers')
    ).not.toBeInTheDocument();
  });

  it('deletes after confirmation, only where viewerCan allows', async () => {
    organizations = [
      testOrganizationListItem(),
      testOrganizationListItem({
        id: 'org-2',
        name: 'Dampfzentrale',
        viewerCan: {
          __typename: 'OrganizationViewerPermissions',
          update: false,
          delete: false,
        },
      }),
    ];
    renderList();

    const deletes = screen.getAllByRole('button', { name: 'delete' });

    expect(deletes).toHaveLength(1);

    fireEvent.click(deletes[0]);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'agenda.organizations.list.confirmDelete',
      })
    );

    await waitFor(() =>
      expect(deleteOrganization).toHaveBeenCalledWith({
        variables: { id: 'org-1' },
      })
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('offers New organisation only to callers who may create one', () => {
    renderList(MEMBER);

    expect(
      screen.queryByRole('link', {
        name: 'agenda.organizations.list.create',
      })
    ).not.toBeInTheDocument();
  });
});
