import { ApolloError } from '@apollo/client';
import { TagType } from '@wepublish/editor/api';
import {
  Event,
  EventFilter,
  getApiClientV2,
  useEventListQuery,
} from '@wepublish/editor/api-v2';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { format as formatDate } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Message, Pagination, Table as RTable, toaster } from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { DeleteEventModal } from './deleteEventModal';

const { Column, HeaderCell, Cell } = RTable;

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

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error?.message}
      </Message>
    );
  }
};

function EventListView() {
  const [filter, setFilter] = useState({} as EventFilter);
  const { t } = useTranslation();
  const [eventDelete, setEventDelete] = useState<Event | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const eventListVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit,
  };

  const client = getApiClientV2();
  const {
    data,
    loading: isLoading,
    refetch,
  } = useEventListQuery({
    client,
    fetchPolicy: 'cache-and-network',
    variables: eventListVariables,
    onError: onErrorToast,
  });

  useEffect(() => {
    refetch(eventListVariables);
  }, [page, limit, filter]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('event.list.title')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_EVENT']}>
          <ListViewActions>
            <Link to="create">
              <IconButton
                appearance="primary"
                icon={<MdAdd />}
              >
                {t('event.list.create')}
              </IconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
        <ListFilters
          fields={['dates', 'name', 'location']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => setFilter(filter)}
          tagType={TagType.Event}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={data?.events?.nodes || []}
        >
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('event.list.name')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </Cell>
          </Column>

          <Column
            width={250}
            resizable
          >
            <HeaderCell>{t('event.list.startsAtHeader')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                <EventStartsAtView startsAt={rowData.startsAt} />
              )}
            </Cell>
          </Column>

          <Column
            width={250}
            resizable
          >
            <HeaderCell>{t('event.list.endsAtHeader')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                <EventEndsAtView endsAt={rowData.endsAt} />
              )}
            </Cell>
          </Column>

          <Column
            width={150}
            resizable
          >
            <HeaderCell>{t('event.list.source')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => rowData.externalSourceName}
            </Cell>
          </Column>

          <Column resizable>
            <HeaderCell align={'center'}>{t('event.list.delete')}</HeaderCell>
            <Cell
              align={'center'}
              style={{ padding: '5px 0' }}
            >
              {(event: RowDataType<Event>) => (
                <IconButton
                  icon={<MdDelete />}
                  color="red"
                  appearance="ghost"
                  circle
                  size="sm"
                  onClick={() => setEventDelete(event as Event)}
                />
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.events?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
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
  'CAN_GET_EVENT',
  'CAN_CREATE_EVENT',
  'CAN_UPDATE_EVENT',
  'CAN_DELETE_EVENT',
])(EventListView);

export { CheckedPermissionComponent as EventListView };
