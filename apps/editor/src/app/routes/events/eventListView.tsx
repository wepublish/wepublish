import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import {
  EventFilter,
  EventListDocument,
  FullEventFragment,
  TagType,
} from '@wepublish/editor/api';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanGetEvent,
  CanUpdateEvent,
} from '@wepublish/permissions';
import {
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  DataTable,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { format as formatDate } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { DeleteEventModal } from './deleteEventModal';

const HeaderInfo = styled.span`
  display: inline-flex;
  margin-left: 4px;
`;

const EVENT_FILTER_FIELDS = ['dates', 'name', 'location'] as const;

export function EventStartsAtView({ startsAt }: { startsAt: string }) {
  const startsAtDate = new Date(startsAt);
  return (
    <time dateTime={startsAtDate.toISOString()}>
      {formatDate(startsAtDate, 'PPP p')}
    </time>
  );
}

export function EventEndsAtView({
  endsAt,
}: {
  endsAt: string | null | undefined;
}) {
  const endsAtDate = endsAt ? new Date(endsAt) : undefined;
  const { t } = useTranslation();

  if (endsAtDate) {
    return (
      <time dateTime={endsAtDate.toISOString()}>
        {formatDate(endsAtDate, 'PPP p')}
      </time>
    );
  }
  return <>{t('event.list.endsAtNone')}</>;
}

function EventListView() {
  const { filter, setFilter, limit, setLimit } =
    useListViewState<EventFilter>('events');
  const { t } = useTranslation();
  const [eventDelete, setEventDelete] = useState<FullEventFragment | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);

  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(EventListDocument, {
    variables: {
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
    },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('event.list.title')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateEvent.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="create"
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('event.list.create')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={EVENT_FILTER_FIELDS}
              filter={filter}
              isLoading={isLoading}
              onSetFilter={filter => {
                setFilter(filter);
                setPage(1);
              }}
              tagType={TagType.Event}
            />
          }
          filterCount={countActiveFilters(EVENT_FILTER_FIELDS, filter)}
          onResetFilters={() =>
            setFilter(clearFilters(EVENT_FILTER_FIELDS, filter))
          }
          storageKey="events"
          data={data?.events?.nodes || []}
          loading={isLoading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('event.list.name'),
              width: 200,
              render: rowData => (
                <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
              ),
            },
            {
              id: 'startsatheader',
              label: t('event.list.startsAtHeader'),
              width: 250,
              render: rowData => (
                <EventStartsAtView startsAt={rowData.startsAt} />
              ),
            },
            {
              id: 'endsatheader',
              label: t('event.list.endsAtHeader'),
              width: 250,
              render: rowData => <EventEndsAtView endsAt={rowData.endsAt} />,
            },
            {
              id: 'source',
              columnLabel: t('event.list.source'),
              label: (
                <>
                  {t('event.list.source')}
                  <HeaderInfo>
                    <InfoTooltip text={t('event.list.sourceInfo')} />
                  </HeaderInfo>
                </>
              ),
              width: 150,
              render: rowData => rowData.externalSourceName,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: event => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() => setEventDelete(event as FullEventFragment)}
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
            limit,
            setPage,
            setLimit: limit => {
              setLimit(limit);
              setPage(1);
            },
          }}
          totalCount={data?.events?.totalCount ?? 0}
        />
      </TableWrapper>

      <DeleteEventModal
        event={eventDelete}
        onDelete={refetch}
        onClose={() => setEventDelete(undefined)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEvent.id,
  CanCreateEvent.id,
  CanUpdateEvent.id,
  CanDeleteEvent.id,
])(EventListView);

export { CheckedPermissionComponent as EventListView };
