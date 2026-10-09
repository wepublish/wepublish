import { useMutation, useQuery } from '@apollo/client/react';
import {
  ImportEventDocument,
  ImportedEventFilter,
  ImportedEventListDocument,
  ImportedEventsIdsDocument,
  createWithV2ApiClient,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  createCheckedPermissionComponent,
  enqueueSnackbar,
  Pagination,
  DataTable,
} from '@wepublish/ui/editor';
import { format as formatDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

export function EventStartsAtView({ startsAt }: { startsAt: string }) {
  const startsAtDate = new Date(startsAt);

  return (
    <time
      suppressHydrationWarning
      dateTime={startsAtDate.toISOString()}
    >
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
      <time
        suppressHydrationWarning
        dateTime={endsAtDate.toISOString()}
      >
        {formatDate(endsAtDate, 'PPP p')}
      </time>
    );
  }
  return <>{t('event.list.endsAtNone')}</>;
}

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error?.message, {
      variant: 'error',
      autoHideDuration: 3000,
    });
  }
};

export default function ImportableEventListView() {
  const [filter, setFilter] = useState({} as ImportedEventFilter);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const importedEventListVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit,
  };

  const updateFilter = (filter: ImportedEventFilter) => {
    setFilter(filter);
    setPage(1); // reset page to first
  };

  const {
    data,
    loading: queryLoading,
    error,
  } = useQuery(ImportedEventListDocument, {
    variables: importedEventListVariables,
  });

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

  const [createEvent, { loading: mutationLoading }] = useMutation(
    ImportEventDocument,
    {
      onCompleted: data => {
        enqueueSnackbar(t('toast.createdSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
        navigate(`/events/edit/${data.importEvent}`);
      },
      onError: onErrorToast,
    }
  );

  const { data: ids } = useQuery(ImportedEventsIdsDocument, {});
  const alreadyImported = ids?.importedEventsIds;

  const importEvent = async (id: string, source: string) => {
    createEvent({ variables: { id, source } });
  };

  const isLoading = queryLoading || mutationLoading;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('importableEvent.title')}</h2>
        </ListViewHeader>
        <ListFilters
          fields={['dates', 'providers', 'name', 'location']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => updateFilter(filter)}
        />
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={data?.importedEvents.nodes || []}
          loading={isLoading}
          columns={[
            {
              id: 'name',
              label: t('event.list.name'),
              width: 200,
              render: rowData => rowData.name,
            },
            {
              id: 'startsatheader',
              label: t('event.list.startsAtHeader'),
              width: 220,
              render: rowData => (
                <EventStartsAtView startsAt={rowData.startsAt} />
              ),
            },
            {
              id: 'endsatheader',
              label: t('event.list.endsAtHeader'),
              width: 220,
              render: rowData => <EventEndsAtView endsAt={rowData.endsAt} />,
            },
            {
              id: 'source',
              label: t('event.list.source'),
              width: 150,
              render: rowData => rowData.externalSourceName,
            },
            {
              id: 'source',
              label: t('event.list.source'),
              width: 150,
              render: rowData =>
                alreadyImported && alreadyImported.includes(rowData.id) ?
                  <Button
                    variant="outlined"
                    disabled
                  >
                    {t('importableEvent.imported')}
                  </Button>
                : <Button
                    variant="contained"
                    onClick={() =>
                      importEvent(rowData.id, rowData.externalSourceName ?? '')
                    }
                  >
                    {t('importableEvent.import')}
                  </Button>,
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
          }}
          totalCount={data?.importedEvents?.totalCount ?? 0}
        />
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createWithV2ApiClient(
  createCheckedPermissionComponent([
    'CAN_GET_EVENT',
    'CAN_CREATE_EVENT',
    'CAN_UPDATE_EVENT',
    'CAN_DELETE_EVENT',
  ])(ImportableEventListView)
);

export { CheckedPermissionComponent as ImportableEventListView };
