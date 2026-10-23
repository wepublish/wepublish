import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  DeleteEventDocument,
  EditorEventListDocument,
  EditorEventListItemFragment,
  TinyOrganizationListDocument,
  UnpublishEventDocument,
} from '@wepublish/editor/api';
import {
  CanCreateEvent,
  CanGetEvents,
  CanGetOtherOrganizationEvents,
  CanPublishEvent,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  ListColumn,
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
import { MdDelete, MdUnpublished } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';

import { formatEventDateTime } from './event-format';
import { EventListEmptyState } from './event-list-empty-state';
import {
  activeEventFilterCount,
  EventListFilterState,
  mapEventSort,
  REVIEW_QUEUE_FILTER,
  REVIEW_QUEUE_SORT,
  toEventFilter,
} from './event-list-filter';
import { EventListFilters } from './event-list-filters';
import { EventNextDate } from './event-next-date';
import { EventPublicationChip } from './event-publication-chip';
import { EventStackList, shouldShowEventStack } from './event-stack-list';

type PendingAction = {
  kind: 'unpublish' | 'delete';
  event: EditorEventListItemFragment;
};

const DEFAULT_SORT = { sortField: 'modifiedAt', sortOrder: 'desc' } as const;

function EventList() {
  const { t, i18n } = useTranslation();
  const [now] = useState(() => new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const view = useListViewState<EventListFilterState>('events', {
    defaultSortField: DEFAULT_SORT.sortField,
    defaultSortOrder: DEFAULT_SORT.sortOrder,
  });

  const fromReviewLink = searchParams.get('review') === '1';
  const filter = fromReviewLink ? REVIEW_QUEUE_FILTER : view.filter;
  const sortField =
    fromReviewLink ? REVIEW_QUEUE_SORT.sortField : view.sortField;
  const sortOrder =
    fromReviewLink ? REVIEW_QUEUE_SORT.sortOrder : view.sortOrder;

  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );

  const canSeeAll = useAuthorisation(CanGetOtherOrganizationEvents.id);
  const canCreate = useAuthorisation(CanCreateEvent.id);
  const canPublish = useAuthorisation(CanPublishEvent.id);

  const { data, loading, refetch } = useQuery(EditorEventListDocument, {
    variables: {
      filter: toEventFilter(filter, now),
      take: view.limit,
      skip: (page - 1) * view.limit,
      sort: mapEventSort(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });

  const { data: membershipData } = useQuery(TinyOrganizationListDocument, {
    variables: { filter: { mine: true }, take: 1 },
    skip: canSeeAll !== false,
  });

  const [unpublishEvent, { loading: unpublishing }] = useMutation(
    UnpublishEventDocument
  );
  const [deleteEvent, { loading: deleting }] = useMutation(DeleteEventDocument);

  const events = data?.events.nodes ?? [];
  const totalCount = data?.events.totalCount ?? 0;
  const filterCount = activeEventFilterCount(filter);
  const hasMembership =
    membershipData ? membershipData.organizations.totalCount > 0 : undefined;

  const leaveReviewLink = () => {
    if (fromReviewLink) {
      setSearchParams(
        params => {
          params.delete('review');
          return params;
        },
        { replace: true }
      );
    }
  };

  const applyFilter = (next: EventListFilterState) => {
    const queueToggled = !!next.reviewRequested !== !!filter.reviewRequested;
    const sort =
      !queueToggled ? { sortField, sortOrder }
      : next.reviewRequested ? REVIEW_QUEUE_SORT
      : DEFAULT_SORT;

    view.update({ filter: next, ...sort });
    leaveReviewLink();
    setPage(1);
  };

  const applySort = (field: string, order: 'asc' | 'desc') => {
    view.update({ filter, sortField: field, sortOrder: order });
    leaveReviewLink();
    setPage(1);
  };

  const confirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    const variables = { id: pendingAction.event.id };

    try {
      if (pendingAction.kind === 'unpublish') {
        await unpublishEvent({ variables });
      } else {
        await deleteEvent({ variables });
        await refetch();
      }
    } catch (error) {
      enqueueSnackbar(humanizeError(error as Error), { variant: 'error' });
    }

    setPendingAction(null);
  };

  const emptyState = (
    <EventListEmptyState
      filter={filter}
      canSeeAll={canSeeAll}
      hasMembership={hasMembership}
      canCreate={canCreate}
      onClearFilters={() => applyFilter({})}
    />
  );

  const columns: ListColumn<EditorEventListItemFragment>[] = [
    {
      id: 'name',
      label: t('agenda.list.name'),
      width: 220,
      alwaysVisible: true,
      render: event => event.name || t('agenda.list.untitled'),
      exportValue: event => event.name ?? '',
    },
    {
      id: 'nextDate',
      label: t('agenda.list.nextDate'),
      width: 190,
      render: event => (
        <EventNextDate
          event={event}
          now={now}
        />
      ),
      exportValue: event =>
        event.nextOccurrence ?
          formatEventDateTime(event.nextOccurrence.dateFrom, i18n.language)
        : '',
    },
    {
      id: 'place',
      label: t('agenda.list.venue'),
      width: 160,
      render: event => event.place?.name ?? '',
    },
    {
      id: 'organization',
      label: t('agenda.list.organization'),
      width: 170,
      render: event => event.organization?.name ?? '',
    },
    {
      id: 'status',
      label: t('agenda.list.status'),
      width: 110,
      render: event => t(`agenda.status.${event.status}`),
    },
    {
      id: 'publication',
      label: t('agenda.list.publication'),
      width: 260,
      render: event => (
        <EventPublicationChip
          event={event}
          now={now}
        />
      ),
    },
    {
      id: 'lastDateAt',
      dataKey: 'lastDateAt',
      sortable: true,
      label: t('agenda.list.lastDate'),
      width: 150,
      render: event =>
        event.lastDateAt ?
          formatEventDateTime(event.lastDateAt, i18n.language)
        : '',
    },
    {
      id: 'modifiedAt',
      dataKey: 'modifiedAt',
      sortable: true,
      label: t('agenda.list.modified'),
      width: 150,
      render: event => formatEventDateTime(event.modifiedAt, i18n.language),
    },
  ];

  const showStack = shouldShowEventStack({
    canPublish,
    filterCount,
    totalCount,
    loadedCount: events.length,
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('agenda.list.title')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      {showStack ?
        <EventStackList
          events={events}
          now={now}
        />
      : <TableWrapper>
          <DataTable
            filters={
              <EventListFilters
                filter={filter}
                canSeeAll={canSeeAll}
                onChange={applyFilter}
              />
            }
            filterCount={filterCount}
            onResetFilters={() => applyFilter({})}
            loading={loading}
            data={events}
            emptyMessage={emptyState}
            sortColumn={sortField}
            sortOrder={sortOrder}
            sortable={columns
              .filter(column => column.sortable)
              .map(column => column.dataKey ?? column.id)}
            onSort={applySort}
            storageKey="events"
            columns={[
              ...columns.map(column => ({
                ...column,
                sortKey: column.dataKey,
                resizable: true,
              })),
              {
                id: 'action',
                label: t('action'),
                width: 100,
                align: 'center',
                fixed: true,
                render: event => (
                  <>
                    {event.viewerCan?.publish &&
                      (event.published || event.pending) && (
                        <IconButtonTooltip caption={t('agenda.list.unpublish')}>
                          <IconButton
                            size="small"
                            aria-label={t('agenda.list.unpublish')}
                            onClick={() =>
                              setPendingAction({ kind: 'unpublish', event })
                            }
                          >
                            <MdUnpublished />
                          </IconButton>
                        </IconButtonTooltip>
                      )}

                    {event.viewerCan?.delete && (
                      <IconButtonTooltip caption={t('delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t('delete')}
                          onClick={() =>
                            setPendingAction({ kind: 'delete', event })
                          }
                        >
                          <MdDelete />
                        </IconButton>
                      </IconButtonTooltip>
                    )}
                  </>
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
      }

      <Dialog
        fullWidth
        maxWidth="sm"
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
      >
        <DialogTitle>
          {pendingAction?.kind === 'unpublish' ?
            t('agenda.list.unpublishTitle')
          : t('agenda.list.deleteTitle')}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {pendingAction?.kind === 'unpublish' ?
              t('agenda.list.unpublishBody', {
                name: pendingAction.event.name || t('agenda.list.untitled'),
              })
            : t('agenda.list.deleteBody', {
                name: pendingAction?.event.name || t('agenda.list.untitled'),
              })
            }
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setPendingAction(null)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color={pendingAction?.kind === 'delete' ? 'error' : 'primary'}
            disabled={unpublishing || deleting}
            onClick={confirmAction}
          >
            {pendingAction?.kind === 'unpublish' ?
              t('agenda.list.confirmUnpublish')
            : t('agenda.list.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEvents.id,
])(EventList);

export { CheckedPermissionComponent as EventList };
