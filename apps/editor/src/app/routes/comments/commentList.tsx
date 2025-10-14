import styled from '@emotion/styled';
import {
  CommentFilter,
  CommentSort,
  CommentState,
  FullCommentFragment,
  useCommentListQuery,
} from '@wepublish/editor/api';
import {
  CommentStateDropdown,
  createCheckedPermissionComponent,
  CreateCommentBtn,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  IconButtonTooltip,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PermissionControl,
  RichTextBlock,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Pagination, Table as RTable, Toggle } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell } = RTable;

const EditIcon = styled.span`
  margin-right: 5px;
`;

function mapColumFieldToGraphQLField(columnField: string): CommentSort | null {
  switch (columnField) {
    case 'createdAt':
      return CommentSort.CreatedAt;
    case 'modifiedAt':
      return CommentSort.ModifiedAt;
    default:
      return null;
  }
}

function CommentList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('modifiedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [filter, setFilter] = useState<CommentFilter>({
    states: [
      CommentState.Approved,
      CommentState.PendingApproval,
      CommentState.PendingUserChanges,
      CommentState.Rejected,
    ],
  });

  const [comments, setComments] = useState<FullCommentFragment[]>([]);

  const commentListVariables = {
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    filter,
  };

  const {
    data,
    refetch,
    loading: isLoading,
  } = useCommentListQuery({
    variables: commentListVariables,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
      filter,
    });
  }, [filter, page, limit, sortOrder, sortField]);

  useEffect(() => {
    if (data?.comments?.nodes) {
      setComments(data.comments.nodes);
      if (data.comments.totalCount + 9 < page * limit) {
        setPage(1);
      }
    }
  }, [data?.comments]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('comments.overview.comments')}</h2>
        </ListViewHeader>

        {/* to fill the grid */}
        <div />

        <ListViewFilterArea>
          <Toggle
            defaultChecked={filter.states?.includes?.(CommentState.Approved)}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || [];

                return {
                  ...f,
                  states:
                    enabled ?
                      [...states, CommentState.Approved]
                    : states.filter(val => val !== CommentState.Approved),
                };
              })
            }
            checkedChildren={t('comments.state.approved')}
            unCheckedChildren={t('comments.state.approved')}
          />

          <Toggle
            defaultChecked={filter.states?.includes?.(
              CommentState.PendingApproval
            )}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || [];

                return {
                  ...f,
                  states:
                    enabled ?
                      [...states, CommentState.PendingApproval]
                    : states.filter(
                        val => val !== CommentState.PendingApproval
                      ),
                };
              })
            }
            checkedChildren={t('comments.state.pendingApproval')}
            unCheckedChildren={t('comments.state.pendingApproval')}
          />

          <Toggle
            defaultChecked={filter.states?.includes?.(
              CommentState.PendingUserChanges
            )}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || [];

                return {
                  ...f,
                  states:
                    enabled ?
                      [...states, CommentState.PendingUserChanges]
                    : states.filter(
                        val => val !== CommentState.PendingUserChanges
                      ),
                };
              })
            }
            checkedChildren={t('comments.state.pendingUserChanges')}
            unCheckedChildren={t('comments.state.pendingUserChanges')}
          />

          <Toggle
            defaultChecked={filter.states?.includes?.(CommentState.Rejected)}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || [];

                return {
                  ...f,
                  states:
                    enabled ?
                      [...states, CommentState.Rejected]
                    : states.filter(val => val !== CommentState.Rejected),
                };
              })
            }
            checkedChildren={t('comments.state.rejected')}
            unCheckedChildren={t('comments.state.rejected')}
          />
        </ListViewFilterArea>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          rowHeight={60}
          rowClassName={rowData => {
            switch (rowData?.state) {
              case CommentState.Approved:
                return 'approved';
              case CommentState.PendingApproval:
                return 'pending-approval';
              case CommentState.PendingUserChanges:
                return 'pending-user';
              case CommentState.Rejected:
                return 'rejected';
              default:
                return '';
            }
          }}
          loading={isLoading}
          data={comments}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc');
            setSortField(sortColumn);
          }}
        >
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column
            width={350}
            align="left"
            verticalAlign="middle"
            resizable
          >
            <HeaderCell>{t('comments.overview.text')}</HeaderCell>
            <Cell dataKey="revisions">
              {(rowData: RowDataType<FullCommentFragment>) =>
                rowData.revisions?.length ?
                  <RichTextBlock
                    displayOnly
                    displayOneLine
                    disabled
                    onChange={() => {
                      return undefined;
                    }}
                    value={
                      rowData.revisions[rowData.revisions?.length - 1]?.text ||
                      []
                    }
                  />
                : null
              }
            </Cell>
          </Column>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column
            width={150}
            align="left"
            verticalAlign="middle"
            resizable
          >
            <HeaderCell>{t('comments.overview.userName')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<FullCommentFragment>) =>
                rowData.user ? rowData.user?.name : rowData.guestUsername
              }
            </Cell>
          </Column>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column
            width={150}
            align="left"
            verticalAlign="middle"
            resizable
            sortable
          >
            <HeaderCell>{t('comments.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({ modifiedAt }: RowDataType<FullCommentFragment>) =>
                t('comments.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt),
                })
              }
            </Cell>
          </Column>

          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column
            width={200}
            align="right"
            verticalAlign="middle"
            fixed="right"
          >
            <HeaderCell>{t('comments.overview.editState')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<FullCommentFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_TAKE_COMMENT_ACTION']}
                >
                  <CommentStateDropdown
                    comment={rowData as FullCommentFragment}
                    size="xs"
                    onStateChanged={async () => {
                      await refetch();
                    }}
                  />
                </PermissionControl>
              )}
            </Cell>
          </Column>

          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column
            width={150}
            align="center"
            verticalAlign="middle"
            fixed="right"
          >
            <HeaderCell>{t('comments.overview.action')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<FullCommentFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_UPDATE_COMMENTS']}
                >
                  {/* edit comment */}
                  <EditIcon>
                    <IconButtonTooltip caption={t('comments.overview.edit')}>
                      <Link to={`edit/${rowData.id}`}>
                        <IconButton
                          icon={<MdEdit />}
                          circle
                          size="sm"
                        />
                      </Link>
                    </IconButtonTooltip>
                  </EditIcon>

                  {/* reply to comment */}
                  <CreateCommentBtn
                    itemType={rowData.itemType}
                    itemID={rowData.itemID}
                    parentID={rowData.id}
                    size="sm"
                    circle
                  />
                </PermissionControl>
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
          total={data?.comments.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_COMMENTS',
  'CAN_TAKE_COMMENT_ACTION',
])(CommentList);
export { CheckedPermissionComponent as CommentList };
