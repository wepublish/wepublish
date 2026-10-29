import { useMutation, useQuery } from '@apollo/client/react';
import {
  ImportEventDocument,
  ImportedEventFilter,
  ImportedEventListDocument,
  ImportedEventsIdsDocument,
  createWithV2ApiClient,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  enqueueSnackbar,
  Pagination,
  DataTable,
  PageTitle,
} from '@wepublish/ui/editor';
import { format as formatDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanGetEvent,
  CanUpdateEvent,
} from '@wepublish/permissions';

const IMPORTABLE_EVENT_FILTER_FIELDS = [
  'dates',
  'providers',
  'name',
  'location',
] as const;

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

  const { data, loading: queryLoading } = useQuery(ImportedEventListDocument, {
    variables: importedEventListVariables,
  });

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
          <PageTitle>{t('importableEvent.title')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={IMPORTABLE_EVENT_FILTER_FIELDS}
              filter={filter}
              isLoading={isLoading}
              onSetFilter={filter => updateFilter(filter)}
            />
          }
          filterCount={countActiveFilters(
            IMPORTABLE_EVENT_FILTER_FIELDS,
            filter
          )}
          onResetFilters={() =>
            updateFilter(clearFilters(IMPORTABLE_EVENT_FILTER_FIELDS, filter))
          }
          storageKey="importable-events"
          data={data?.importedEvents.nodes || []}
          loading={isLoading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
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
              id: 'action',
              label: t('action'),
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
    CanGetEvent.id,
    CanCreateEvent.id,
    CanUpdateEvent.id,
    CanDeleteEvent.id,
  ])(ImportableEventListView)
);

export { CheckedPermissionComponent as ImportableEventListView };
