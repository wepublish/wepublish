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
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Pagination,
  PermissionControl,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { format as formatDate } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { DeleteEventModal } from './deleteEventModal';

const { Column, HeaderCell, Cell } = RTable;

const HeaderInfo = styled.span`
  display: inline-flex;
  margin-left: 4px;
`;

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

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error && humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
};

function EventListView() {
  const { filter, setFilter, limit, setLimit } =
    useListViewState<EventFilter>('events');
  const { t } = useTranslation();
  const [eventDelete, setEventDelete] = useState<FullEventFragment | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);

  const eventListVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit,
  };

  const {
    data,
    loading: isLoading,
    refetch,
    error,
  } = useQuery(EventListDocument, {
    variables: eventListVariables,
  });

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

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
              <Button
                variant="contained"
                startIcon={<MdAdd />}
              >
                {t('event.list.create')}
              </Button>
            </Link>
          </ListViewActions>
        </PermissionControl>
        <ListFilters
          fields={['dates', 'name', 'location']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => {
            setFilter(filter);
            setPage(1);
          }}
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
              {(rowData: RowDataType<FullEventFragment>) => (
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
              {(rowData: RowDataType<FullEventFragment>) => (
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
              {(rowData: RowDataType<FullEventFragment>) => (
                <EventEndsAtView endsAt={rowData.endsAt} />
              )}
            </Cell>
          </Column>

          <Column
            width={150}
            resizable
          >
            <HeaderCell>
              {t('event.list.source')}
              <HeaderInfo>
                <InfoTooltip text={t('event.list.sourceInfo')} />
              </HeaderInfo>
            </HeaderCell>
            <Cell>
              {(rowData: RowDataType<FullEventFragment>) =>
                rowData.externalSourceName
              }
            </Cell>
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell align="center">
              {(event: RowDataType<FullEventFragment>) => (
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
              )}
            </PaddedCell>
          </Column>
        </Table>

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
  'CAN_GET_EVENT',
  'CAN_CREATE_EVENT',
  'CAN_UPDATE_EVENT',
  'CAN_DELETE_EVENT',
])(EventListView);

export { CheckedPermissionComponent as EventListView };
