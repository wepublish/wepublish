import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Chip } from '@mui/material';
import {
  DeleteOrganizationDocument,
  EditorOrganizationListDocument,
  EditorOrganizationListItemFragment,
  OrganizationFilter,
  OrganizationSort,
} from '@wepublish/editor/api';
import {
  CanCreateOrganization,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  Link,
  ListColumn,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PageTitle,
  Pagination,
  TableWrapper,
  useAuthorisation,
  useListViewState,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { ConfirmDialog } from '../confirm-dialog';
import {
  activeFilterCount,
  FilterForm,
  FilterSearch,
  FilterSwitch,
  TriStateFilter,
} from '../list-filters';
import { organizationEditPath } from './organization-paths';

export type OrganizationListFilterState = {
  name?: string | null;
  mine?: boolean | null;
  enabled?: boolean | null;
  hasMembers?: boolean | null;
  partner?: boolean | null;
  createdByMigration?: boolean | null;
};

const SENSITIVE_FILTERS = [
  'hasMembers',
  'partner',
  'createdByMigration',
] as const;

export const toOrganizationFilter = (
  state: OrganizationListFilterState,
  canSeeSensitive: boolean
): OrganizationFilter => {
  const filter: OrganizationFilter = {};

  if (state.name) {
    filter.name = state.name;
  }

  if (state.mine != null) {
    filter.mine = state.mine;
  } else if (!canSeeSensitive) {
    filter.mine = true;
  }

  if (state.enabled != null) {
    filter.enabled = state.enabled;
  }

  if (canSeeSensitive) {
    SENSITIVE_FILTERS.forEach(key => {
      if (state[key] != null) {
        filter[key] = state[key];
      }
    });
  }

  return filter;
};

const SORTS: Record<string, OrganizationSort> = {
  name: OrganizationSort.Name,
  createdAt: OrganizationSort.CreatedAt,
  modifiedAt: OrganizationSort.ModifiedAt,
};

const Markers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const sensitiveRow = (row: EditorOrganizationListItemFragment) =>
  row.__typename === 'SensitiveDataOrganization' ? row : null;

function OrganizationList() {
  const { t } = useTranslation();
  const view = useListViewState<OrganizationListFilterState>('organizations', {
    defaultSortField: 'name',
    defaultSortOrder: 'asc',
  });
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] =
    useState<EditorOrganizationListItemFragment | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const mayReadOthers = useAuthorisation(CanGetOtherOrganizations.id);
  const mayUpdateOthers = useAuthorisation(CanUpdateOtherOrganizations.id);
  const mayCreate = useAuthorisation(CanCreateOrganization.id) === true;
  const canSeeSensitive = mayReadOthers === true || mayUpdateOthers === true;
  const rolesUnknown = mayReadOthers === undefined;

  const filter = view.filter;
  const mine = filter.mine ?? !canSeeSensitive;

  const { data, loading, refetch } = useQuery(EditorOrganizationListDocument, {
    variables: {
      filter: toOrganizationFilter(filter, canSeeSensitive),
      take: view.limit,
      skip: (page - 1) * view.limit,
      sort: SORTS[view.sortField] ?? OrganizationSort.Name,
      order: mapTableSortTypeToGraphQLSortOrder(view.sortOrder),
    },
    skip: rolesUnknown,
  });

  const [deleteOrganization, { loading: deleting }] = useMutation(
    DeleteOrganizationDocument
  );

  const organizations = data?.organizations.nodes ?? [];
  const totalCount = data?.organizations.totalCount ?? 0;
  const filterCount = activeFilterCount(filter);

  const applyFilter = (next: OrganizationListFilterState) => {
    view.setFilter(next);
    setPage(1);
  };
  const update = (patch: OrganizationListFilterState) =>
    applyFilter({ ...filter, ...patch });

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteOrganization({ variables: { id: pendingDelete.id } });
      setPendingDelete(null);
      await refetch();
    } catch (error) {
      setDeleteError(humanizeError(error as Error));
    }
  };

  const columns: ListColumn<EditorOrganizationListItemFragment>[] = [
    {
      id: 'name',
      dataKey: 'name',
      sortable: true,
      label: t('agenda.organizations.list.name'),
      width: 260,
      alwaysVisible: true,
      render: row => <Link to={organizationEditPath(row.id)}>{row.name}</Link>,
      exportValue: row => row.name,
    },
    {
      id: 'location',
      label: t('agenda.organizations.list.location'),
      width: 180,
      render: row => [row.zip, row.city].filter(Boolean).join(' '),
    },
    {
      id: 'enabled',
      label: t('agenda.organizations.list.status'),
      width: 120,
      render: row =>
        row.enabled ?
          t('agenda.organizations.list.active')
        : t('agenda.organizations.list.inactive'),
    },
    ...(canSeeSensitive ?
      [
        {
          id: 'markers',
          label: t('agenda.organizations.list.markers'),
          width: 280,
          render: (row: EditorOrganizationListItemFragment) => {
            const sensitive = sensitiveRow(row);

            if (!sensitive) {
              return null;
            }

            return (
              <Markers>
                {sensitive.members.length === 0 && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={t('agenda.organizations.markers.noMembers')}
                    title={t('agenda.organizations.markers.noMembersHint')}
                  />
                )}
                {sensitive.partner && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t('agenda.organizations.markers.partner')}
                  />
                )}
                {sensitive.createdByMigration && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t('agenda.organizations.markers.migrated')}
                    title={t('agenda.organizations.markers.migratedHint')}
                  />
                )}
              </Markers>
            );
          },
        } satisfies ListColumn<EditorOrganizationListItemFragment>,
      ]
    : []),
  ];

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('agenda.organizations.list.title')}</PageTitle>
        </ListViewHeader>

        {mayCreate && (
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/organizations/create"
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('agenda.organizations.list.create')}
            </Button>
          </ListViewActions>
        )}
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <FilterForm>
              <FilterSearch
                label={t('agenda.organizations.filter.search')}
                value={filter.name}
                onChange={name => update({ name })}
              />
              <FilterSwitch
                label={t('agenda.organizations.filter.mine')}
                checked={mine}
                onChange={checked => update({ mine: checked })}
              />
              <TriStateFilter
                label={t('agenda.organizations.filter.enabled')}
                value={filter.enabled}
                yesLabel={t('agenda.organizations.list.active')}
                noLabel={t('agenda.organizations.list.inactive')}
                onChange={enabled => update({ enabled })}
              />
              {canSeeSensitive && (
                <>
                  <TriStateFilter
                    label={t('agenda.organizations.filter.members')}
                    value={filter.hasMembers}
                    yesLabel={t('agenda.organizations.filter.membersSome')}
                    noLabel={t('agenda.organizations.filter.membersNone')}
                    onChange={hasMembers => update({ hasMembers })}
                  />
                  <TriStateFilter
                    label={t('agenda.organizations.filter.partner')}
                    value={filter.partner}
                    yesLabel={t('agenda.organizations.filter.yes')}
                    noLabel={t('agenda.organizations.filter.no')}
                    onChange={partner => update({ partner })}
                  />
                  <TriStateFilter
                    label={t('agenda.organizations.filter.migrated')}
                    value={filter.createdByMigration}
                    yesLabel={t('agenda.organizations.filter.yes')}
                    noLabel={t('agenda.organizations.filter.no')}
                    onChange={createdByMigration =>
                      update({ createdByMigration })
                    }
                  />
                </>
              )}
            </FilterForm>
          }
          filterCount={filterCount}
          onResetFilters={() => applyFilter({})}
          loading={loading}
          data={organizations}
          emptyMessage={
            filterCount > 0 ? t('agenda.organizations.list.emptyFiltered')
            : mine ?
              t('agenda.organizations.list.emptyMine')
            : t('agenda.organizations.list.empty')
          }
          sortColumn={view.sortField}
          sortOrder={view.sortOrder}
          sortable={['name']}
          onSort={(field, order) => {
            view.setSort(field, order);
            setPage(1);
          }}
          storageKey="organizations"
          columns={[
            ...columns.map(column => ({
              ...column,
              sortKey: column.dataKey,
              resizable: true,
            })),
            {
              id: 'action',
              label: t('action'),
              width: 80,
              align: 'center',
              fixed: true,
              render: row =>
                row.viewerCan.delete && (
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={t('delete')}
                      onClick={() => {
                        setDeleteError(undefined);
                        setPendingDelete(row);
                      }}
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit: view.limit,
            setPage,
            setLimit: limit => {
              view.setLimit(limit);
              setPage(1);
            },
          }}
          totalCount={totalCount}
        />
      </TableWrapper>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('agenda.organizations.list.deleteTitle')}
        body={t('agenda.organizations.list.deleteBody', {
          name: pendingDelete?.name ?? '',
        })}
        confirmLabel={t('agenda.organizations.list.confirmDelete')}
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetOtherOrganizations.id,
  CanUpdateOtherOrganizations.id,
  CanUpdateOrganization.id,
])(OrganizationList);

export { CheckedPermissionComponent as OrganizationList };
