import styled from '@emotion/styled';
import {
  AuditLogAction,
  AuditLogActorType,
  AuditLogFilter,
  AuditLogSort,
  FullAuditLogFragment,
  SortOrder,
  useAuditLogListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButtonTooltip,
  ListViewContainer,
  ListViewHeader,
  Table,
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
  Message,
  Pagination,
  Table as RTable,
  SelectPicker,
  Tag as RTag,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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
  color: #97969b;
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
  'green' | 'blue' | 'red' | 'violet'
> = {
  [AuditLogAction.Create]: 'green',
  [AuditLogAction.Update]: 'blue',
  [AuditLogAction.Delete]: 'red',
  [AuditLogAction.Other]: 'violet',
};

function AuditLogList() {
  const { t } = useTranslation();

  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [auditLogs, setAuditLogs] = useState<FullAuditLogFragment[]>([]);

  const { data, loading: isLoading } = useAuditLogListQuery({
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

        <Message
          type="info"
          showIcon
        >
          {t('auditLogList.overview.notSupported')}
        </Message>
      </>
    );
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('auditLogList.overview.title')}</h2>
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
            value={filter.sessionID ?? ''}
            placeholder={t('auditLogList.filter.session')}
            onChange={value => updateFilter({ sessionID: value || undefined })}
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
            {t('auditLogList.filter.impersonatedOnly')}
          </Checkbox>
        </FilterBar>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={auditLogs}
          sortColumn="createdAt"
          sortType={sortOrder}
          onSortColumn={(_, sortType) => setSortOrder(sortType ?? 'desc')}
        >
          <Column
            width={180}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('auditLogList.overview.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">
              {({ createdAt }: RowDataType<FullAuditLogFragment>) =>
                t('auditLogList.overview.createdAtDate', {
                  createdAtDate: new Date(createdAt),
                })
              }
            </RCell>
          </Column>

          <Column
            width={240}
            align="left"
            resizable
          >
            <HeaderCell>{t('auditLogList.overview.actor')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullAuditLogFragment>) => {
                const actor = describeActor(rowData as FullAuditLogFragment);

                return <Truncate title={actor}>{actor}</Truncate>;
              }}
            </RCell>
          </Column>

          <Column
            width={110}
            align="left"
            resizable
          >
            <HeaderCell>{t('auditLogList.overview.action')}</HeaderCell>
            <RCell>
              {({ action }: RowDataType<FullAuditLogFragment>) => (
                <RTag color={actionColors[action as AuditLogAction]}>
                  {t(`auditLogList.action.${action}`)}
                </RTag>
              )}
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('auditLogList.overview.mutation')}</HeaderCell>
            <RCell>
              {({ mutation }: RowDataType<FullAuditLogFragment>) => (
                <Truncate title={mutation}>{mutation}</Truncate>
              )}
            </RCell>
          </Column>

          <Column
            width={280}
            align="left"
            resizable
          >
            <HeaderCell>{t('auditLogList.overview.record')}</HeaderCell>
            <RCell>
              {({ entity, recordId }: RowDataType<FullAuditLogFragment>) =>
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
                : <Muted>—</Muted>
              }
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('auditLogList.overview.session')}</HeaderCell>
            <RCell>
              {({ sessionID }: RowDataType<FullAuditLogFragment>) =>
                sessionID ?
                  <IconButtonTooltip
                    caption={t('auditLogList.overview.filterBySession')}
                  >
                    <Monospace
                      onClick={() => updateFilter({ sessionID })}
                      role="button"
                    >
                      {sessionID.slice(0, 8)}… <MdFilterAlt />
                    </Monospace>
                  </IconButtonTooltip>
                : <Muted>—</Muted>
              }
            </RCell>
          </Column>

          <Column
            width={220}
            align="left"
            resizable
          >
            <HeaderCell>{t('auditLogList.overview.status')}</HeaderCell>
            <RCell>
              {({
                success,
                errorMessage,
              }: RowDataType<FullAuditLogFragment>) =>
                success ?
                  <RTag color="green">
                    {t('auditLogList.overview.succeeded')}
                  </RTag>
                : <IconButtonTooltip caption={errorMessage ?? ''}>
                    <RTag color="red">{t('auditLogList.overview.failed')}</RTag>
                  </IconButtonTooltip>
              }
            </RCell>
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
          total={data?.auditLogs.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_AUDIT_LOGS',
])(AuditLogList);
export { CheckedPermissionComponent as AuditLogList };
