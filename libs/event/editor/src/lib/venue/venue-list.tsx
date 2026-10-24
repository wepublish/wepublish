import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Chip } from '@mui/material';
import {
  DeletePlaceDocument,
  EditorPlaceListDocument,
  EditorPlaceListItemFragment,
  PlaceFilter,
  PlaceSort,
} from '@wepublish/editor/api';
import {
  CanCreateEvent,
  CanGetEvents,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
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
import { venueDeleteRefusal } from './venue-delete-refusal';
import { venueCreatePath, venueEditPath } from './venue-paths';

export type VenueListFilterState = {
  search?: string | null;
  mine?: boolean | null;
  enabled?: boolean | null;
};

export const toPlaceFilter = (
  state: VenueListFilterState,
  canSeeAll: boolean
): PlaceFilter => {
  const filter: PlaceFilter = {};

  if (state.search) {
    filter.search = state.search;
  }

  if (state.mine != null) {
    filter.mine = state.mine;
  } else if (!canSeeAll) {
    filter.mine = true;
  }

  if (state.enabled != null) {
    filter.enabled = state.enabled;
  }

  return filter;
};

const Markers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const SORTS: Record<string, PlaceSort> = {
  name: PlaceSort.Name,
  createdAt: PlaceSort.CreatedAt,
  modifiedAt: PlaceSort.ModifiedAt,
};

function VenueList() {
  const { t } = useTranslation();
  const view = useListViewState<VenueListFilterState>('venues', {
    defaultSortField: 'name',
    defaultSortOrder: 'asc',
  });
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] =
    useState<EditorPlaceListItemFragment | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const mayReadOthers = useAuthorisation(CanGetOtherOrganizations.id);
  const mayUpdateOthers = useAuthorisation(CanUpdateOtherOrganizations.id);
  const mayCreate = useAuthorisation(CanUpdateOrganization.id) === true;
  const canSeeAll = mayReadOthers === true || mayUpdateOthers === true;
  const rolesUnknown = mayReadOthers === undefined;

  const filter = view.filter;
  const mine = filter.mine ?? !canSeeAll;

  const { data, loading, refetch } = useQuery(EditorPlaceListDocument, {
    variables: {
      filter: toPlaceFilter(filter, canSeeAll),
      take: view.limit,
      skip: (page - 1) * view.limit,
      sort: SORTS[view.sortField] ?? PlaceSort.Name,
      order: mapTableSortTypeToGraphQLSortOrder(view.sortOrder),
    },
    skip: rolesUnknown,
  });

  const [deletePlace, { loading: deleting }] = useMutation(DeletePlaceDocument);

  const places = data?.places.nodes ?? [];
  const totalCount = data?.places.totalCount ?? 0;
  const filterCount = activeFilterCount(filter);

  const applyFilter = (next: VenueListFilterState) => {
    view.setFilter(next);
    setPage(1);
  };
  const update = (patch: VenueListFilterState) =>
    applyFilter({ ...filter, ...patch });

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await deletePlace({ variables: { id: pendingDelete.id } });
      setPendingDelete(null);
      await refetch();
    } catch (error) {
      setDeleteError(venueDeleteRefusal(t, error));
    }
  };

  const columns: ListColumn<EditorPlaceListItemFragment>[] = [
    {
      id: 'name',
      dataKey: 'name',
      sortable: true,
      label: t('agenda.venues.list.name'),
      width: 240,
      alwaysVisible: true,
      render: place => <Link to={venueEditPath(place.id)}>{place.name}</Link>,
      exportValue: place => place.name,
    },
    {
      id: 'address',
      label: t('agenda.venues.list.address'),
      width: 260,
      render: place =>
        [place.address, [place.zip, place.city].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', '),
    },
    {
      id: 'organization',
      label: t('agenda.venues.list.organization'),
      width: 200,
      render: place => place.organization?.name ?? '',
    },
    {
      id: 'status',
      label: t('agenda.venues.list.status'),
      width: 200,
      render: place => (
        <Markers>
          <span>
            {place.enabled ?
              t('agenda.venues.list.active')
            : t('agenda.venues.list.inactive')}
          </span>
          {place.private && (
            <Chip
              size="small"
              variant="outlined"
              label={t('agenda.venues.markers.private')}
              title={t('agenda.venues.form.private')}
            />
          )}
        </Markers>
      ),
    },
  ];

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('agenda.venues.list.title')}</PageTitle>
        </ListViewHeader>

        {mayCreate && (
          <ListViewActions>
            <Button
              component={RouterLink}
              to={venueCreatePath()}
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('agenda.venues.list.create')}
            </Button>
          </ListViewActions>
        )}
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <FilterForm>
              <FilterSearch
                label={t('agenda.venues.filter.search')}
                value={filter.search}
                onChange={search => update({ search })}
              />
              <FilterSwitch
                label={t('agenda.venues.filter.mine')}
                checked={mine}
                onChange={checked => update({ mine: checked })}
              />
              <TriStateFilter
                label={t('agenda.venues.filter.enabled')}
                value={filter.enabled}
                yesLabel={t('agenda.venues.list.active')}
                noLabel={t('agenda.venues.list.inactive')}
                onChange={enabled => update({ enabled })}
              />
            </FilterForm>
          }
          filterCount={filterCount}
          onResetFilters={() => applyFilter({})}
          loading={loading}
          data={places}
          emptyMessage={
            filterCount > 0 ? t('agenda.venues.list.emptyFiltered')
            : mine ?
              t('agenda.venues.list.emptyMine')
            : t('agenda.venues.list.empty')
          }
          sortColumn={view.sortField}
          sortOrder={view.sortOrder}
          sortable={['name']}
          onSort={(field, order) => {
            view.setSort(field, order);
            setPage(1);
          }}
          storageKey="venues"
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
              render: place =>
                place.viewerCan.delete && (
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={t('delete')}
                      onClick={() => {
                        setDeleteError(undefined);
                        setPendingDelete(place);
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
        title={t('agenda.venues.delete.title')}
        body={t('agenda.venues.delete.body', {
          name: pendingDelete?.name ?? '',
        })}
        confirmLabel={t('agenda.venues.delete.confirm')}
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEvents.id,
  CanCreateEvent.id,
  CanUpdateOrganization.id,
  CanGetOtherOrganizations.id,
  CanUpdateOtherOrganizations.id,
])(VenueList);

export { CheckedPermissionComponent as VenueList };
