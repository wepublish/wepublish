import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  AuditLogAction,
  AuditLogActorType,
  AuditLogFilter,
  AuditLogListDocument,
  AuditLogSort,
  FullAuditLogFragment,
  SortOrder,
} from '@wepublish/editor/api';
import { CanGetAuditLogs } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DateRangeFilter,
  IconButtonTooltip,
  InfoTooltip,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFilterAlt, MdPersonSearch } from 'react-icons/md';

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  width: 100%;
`;

const SearchInput = styled(TextField)`
  max-width: 320px;
`;

const ActionSelect = styled(TextField)`
  min-width: 220px;
`;

const Monospace = styled.span`
  font-family: monospace;
  font-size: 0.85em;
  cursor: pointer;
`;

const Muted = styled.span`
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Truncate = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const actionColors: Record<
  AuditLogAction,
  'success' | 'primary' | 'error' | 'secondary'
> = {
  [AuditLogAction.Create]: 'success',
  [AuditLogAction.Update]: 'primary',
  [AuditLogAction.Delete]: 'error',
  [AuditLogAction.Other]: 'secondary',
};

function AuditLogList() {
  const { t } = useTranslation();

  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, loading: isLoading } = useQuery(AuditLogListDocument, {
    variables: {
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: AuditLogSort.CreatedAt,
      order: sortOrder === 'asc' ? SortOrder.Ascending : SortOrder.Descending,
    },
    fetchPolicy: 'cache-and-network',
  });

  const auditLogs = data?.auditLogs?.nodes ?? [];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilter(current => ({ ...current, search: search || undefined }));
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.ceil((data?.auditLogs?.totalCount ?? 0) / limit);
  if (totalPages > 0 && page > totalPages) {
    setPage(1);
  }

  const updateFilter = (partial: Partial<AuditLogFilter>) => {
    setFilter(current => ({ ...current, ...partial }));
    setPage(1);
  };

  const describeActor = (entry: FullAuditLogFragment) => {
    if (entry.actorType === AuditLogActorType.Token) {
      return t('auditLogList.overview.tokenActor', {
        name: entry.tokenName ?? t('auditLogList.overview.unknownActor'),
      });
    }

    const actor = entry.userEmail ?? t('auditLogList.overview.unknownActor');

    if (entry.impersonatedBy) {
      return t('auditLogList.overview.impersonatedActor', {
        actor,
        impersonator: entry.impersonatedBy,
      });
    }

    return actor;
  };

  if (data?.auditLogs && !data.auditLogs.supported) {
    return (
      <>
        <ListViewContainer>
          <ListViewHeader>
            <PageTitle>{t('auditLogList.overview.title')}</PageTitle>
          </ListViewHeader>
        </ListViewContainer>

        <Alert severity="info">{t('auditLogList.overview.notSupported')}</Alert>
      </>
    );
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {t('auditLogList.overview.title')}{' '}
            <InfoTooltip text={t('auditLogList.overview.titleInfo')} />
          </PageTitle>
        </ListViewHeader>

        <FilterBar>
          <SearchInput
            value={search}
            placeholder={t('auditLogList.filter.searchPlaceholder')}
            onChange={event => setSearch(event.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <MdPersonSearch />
                  </InputAdornment>
                ),
              },
            }}
          />

          <ActionSelect
            select
            label={t('auditLogList.filter.action')}
            value={filter.actions?.[0] ?? ''}
            onChange={event => {
              const value = event.target.value as AuditLogAction;
              updateFilter({ actions: value ? [value] : undefined });
            }}
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
          >
            <MenuItem value="">{t('auditLogList.filter.anyAction')}</MenuItem>

            {Object.values(AuditLogAction).map(action => (
              <MenuItem
                key={action}
                value={action}
              >
                {t(`auditLogList.action.${action}`)}
              </MenuItem>
            ))}
          </ActionSelect>

          <TextField
            value={filter.entity ?? ''}
            placeholder={t('auditLogList.filter.entity')}
            onChange={event =>
              updateFilter({ entity: event.target.value || undefined })
            }
            style={{ width: 160 }}
          />

          <TextField
            value={filter.sessionId ?? ''}
            placeholder={t('auditLogList.filter.session')}
            onChange={event =>
              updateFilter({ sessionId: event.target.value || undefined })
            }
            style={{ width: 240 }}
          />

          <DateRangeFilter
            label={t('auditLogList.filter.dateFrom')}
            value={{
              from: filter.from ? new Date(filter.from) : null,
              to: filter.to ? new Date(filter.to) : null,
            }}
            onChange={({ from, to }) =>
              updateFilter({
                from: from?.toISOString(),
                to: to?.toISOString(),
              })
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={filter.success === false}
                onChange={(_event, checked) =>
                  updateFilter({ success: checked ? false : undefined })
                }
              />
            }
            label={t('auditLogList.filter.failuresOnly')}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(filter.impersonatedOnly)}
                onChange={(_event, checked) =>
                  updateFilter({ impersonatedOnly: checked || undefined })
                }
              />
            }
            label={
              <>
                {t('auditLogList.filter.impersonatedOnly')}{' '}
                <InfoTooltip
                  text={t('auditLogList.filter.impersonatedOnlyInfo')}
                />
              </>
            }
          />
        </FilterBar>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="audit-log"
          data={auditLogs}
          loading={isLoading}
          columns={[
            {
              id: 'createdat',
              alwaysVisible: true,
              label: t('auditLogList.overview.createdAt'),
              width: 180,
              align: 'left',
              render: ({ createdAt }) =>
                t('auditLogList.overview.createdAtDate', {
                  createdAtDate: new Date(createdAt),
                }),
            },
            {
              id: 'actor',
              label: t('auditLogList.overview.actor'),
              width: 240,
              align: 'left',
              render: rowData => {
                const actor = describeActor(rowData as FullAuditLogFragment);

                return <Truncate title={actor}>{actor}</Truncate>;
              },
            },
            {
              id: 'action',
              label: t('auditLogList.overview.action'),
              width: 110,
              align: 'left',
              render: ({ action }) => (
                <Chip
                  color={actionColors[action as AuditLogAction]}
                  label={t(`auditLogList.action.${action}`)}
                />
              ),
            },
            {
              id: 'mutation',
              label: (
                <>
                  {t('auditLogList.overview.mutation')}{' '}
                  <InfoTooltip text={t('auditLogList.overview.mutationInfo')} />
                </>
              ),
              width: 200,
              align: 'left',
              render: ({ mutation }) => (
                <Truncate title={mutation}>{mutation}</Truncate>
              ),
            },
            {
              id: 'record',
              label: t('auditLogList.overview.record'),
              width: 280,
              align: 'left',
              render: ({ entity, recordId }) =>
                entity ?
                  <Truncate
                    title={recordId ? `${entity} · ${recordId}` : entity}
                  >
                    {entity}
                    {recordId && (
                      <>
                        {' '}
                        <Muted>{recordId}</Muted>
                      </>
                    )}
                  </Truncate>
                : <Muted>—</Muted>,
            },
            {
              id: 'session',
              label: (
                <>
                  {t('auditLogList.overview.session')}{' '}
                  <InfoTooltip text={t('auditLogList.overview.sessionInfo')} />
                </>
              ),
              width: 200,
              align: 'left',
              render: ({ sessionId }) =>
                sessionId ?
                  <IconButtonTooltip
                    caption={t('auditLogList.overview.filterBySession')}
                  >
                    <Monospace
                      onClick={() => updateFilter({ sessionId })}
                      role="button"
                    >
                      {sessionId.slice(0, 8)}… <MdFilterAlt />
                    </Monospace>
                  </IconButtonTooltip>
                : <Muted>—</Muted>,
            },
            {
              id: 'status',
              label: t('auditLogList.overview.status'),
              width: 220,
              align: 'left',
              render: ({ success, errorMessage }) =>
                success ?
                  <Chip
                    color="success"
                    label={t('auditLogList.overview.succeeded')}
                  />
                : <IconButtonTooltip caption={errorMessage ?? ''}>
                    <Chip
                      color="error"
                      label={t('auditLogList.overview.failed')}
                    />
                  </IconButtonTooltip>,
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
          totalCount={data?.auditLogs.totalCount ?? 0}
        />
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetAuditLogs.id,
])(AuditLogList);
export { CheckedPermissionComponent as AuditLogList };
