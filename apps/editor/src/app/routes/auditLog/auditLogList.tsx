import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Chip } from '@mui/material';
import {
  AuditLogAction,
  AuditLogActorType,
  AuditLogFilter,
  AuditLogListDocument,
  AuditLogSort,
  FullAuditLogFragment,
  SortOrder,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DataTable,
  IconButtonTooltip,
  InfoTooltip,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFilterAlt, MdPersonSearch } from 'react-icons/md';
import {
  Checkbox,
  DateRangePicker,
  Input,
  InputGroup,
  SelectPicker,
} from 'rsuite';

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  width: 100%;
`;

const SearchInput = styled(InputGroup)`
  max-width: 320px;
`;

const Monospace = styled.span`
  font-family: monospace;
  font-size: 0.85em;
  cursor: pointer;
`;

const Muted = styled.span`
  color: var(--rs-text-secondary);
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
  const [auditLogs, setAuditLogs] = useState<FullAuditLogFragment[]>([]);

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilter(current => ({ ...current, search: search || undefined }));
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (data?.auditLogs?.nodes) {
      setAuditLogs(data.auditLogs.nodes);

      if (Math.ceil(data.auditLogs.totalCount / limit) < page) {
        setPage(1);
      }
    }
  }, [data?.auditLogs, limit, page]);

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
            <h2>{t('auditLogList.overview.title')}</h2>
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
          <h2>
            {t('auditLogList.overview.title')}{' '}
            <InfoTooltip text={t('auditLogList.overview.titleInfo')} />
          </h2>
        </ListViewHeader>

        <FilterBar>
          <SearchInput inside>
            <Input
              value={search}
              placeholder={t('auditLogList.filter.searchPlaceholder')}
              onChange={value => setSearch(value)}
            />
            <InputGroup.Addon>
              <MdPersonSearch />
            </InputGroup.Addon>
          </SearchInput>

          <SelectPicker
            data={Object.values(AuditLogAction).map(action => ({
              label: t(`auditLogList.action.${action}`),
              value: action,
            }))}
            value={filter.actions?.[0] ?? null}
            placeholder={t('auditLogList.filter.action')}
            onChange={value =>
              updateFilter({ actions: value ? [value] : undefined })
            }
            searchable={false}
            style={{ width: 160 }}
          />

          <Input
            value={filter.entity ?? ''}
            placeholder={t('auditLogList.filter.entity')}
            onChange={value => updateFilter({ entity: value || undefined })}
            style={{ width: 160 }}
          />

          <Input
            value={filter.sessionId ?? ''}
            placeholder={t('auditLogList.filter.session')}
            onChange={value => updateFilter({ sessionId: value || undefined })}
            style={{ width: 240 }}
          />

          <DateRangePicker
            value={
              filter.from && filter.to ?
                [new Date(filter.from), new Date(filter.to)]
              : null
            }
            placeholder={t('auditLogList.filter.dateRange')}
            onChange={range =>
              updateFilter({
                from: range?.[0]?.toISOString(),
                to: range?.[1]?.toISOString(),
              })
            }
          />

          <Checkbox
            checked={filter.success === false}
            onChange={(_, checked) =>
              updateFilter({ success: checked ? false : undefined })
            }
          >
            {t('auditLogList.filter.failuresOnly')}
          </Checkbox>

          <Checkbox
            checked={Boolean(filter.impersonatedOnly)}
            onChange={(_, checked) =>
              updateFilter({ impersonatedOnly: checked || undefined })
            }
          >
            {t('auditLogList.filter.impersonatedOnly')}{' '}
            <InfoTooltip text={t('auditLogList.filter.impersonatedOnlyInfo')} />
          </Checkbox>
        </FilterBar>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={auditLogs}
          loading={isLoading}
          columns={[
            {
              id: 'createdat',
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
  'CAN_GET_AUDIT_LOGS',
])(AuditLogList);
export { CheckedPermissionComponent as AuditLogList };
