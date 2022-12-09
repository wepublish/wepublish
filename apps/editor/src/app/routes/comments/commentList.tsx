import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {FlexboxGrid, IconButton, Pagination, Table, Toggle} from 'rsuite'

import {
  Comment,
  CommentFilter,
  CommentSort,
  CommentState,
  FullCommentFragment,
  useCommentListQuery
} from '../../api'
import {CommentStateDropdown} from '../../atoms/comment/commentStateDropdown'
import {ReplyCommentBtn} from '../../atoms/comment/replyCommentBtn'
import {IconButtonTooltip} from '../../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../../atoms/permissionControl'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../../utility'

const {Column, HeaderCell, Cell} = Table

function mapColumFieldToGraphQLField(columnField: string): CommentSort | null {
  switch (columnField) {
    case 'createdAt':
      return CommentSort.CreatedAt
    case 'modifiedAt':
      return CommentSort.ModifiedAt
    default:
      return null
  }
}

function CommentList() {
  const {t} = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('modifiedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [filter, setFilter] = useState<CommentFilter>({
    states: [
      CommentState.Approved,
      CommentState.PendingApproval,
      CommentState.PendingUserChanges,
      CommentState.Rejected
    ]
  })

  const [comments, setComments] = useState<FullCommentFragment[]>([])

  const commentListVariables = {
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    filter
  }

  const {data, refetch, loading: isLoading} = useCommentListQuery({
    variables: commentListVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
      filter
    })
  }, [filter, page, limit, sortOrder, sortField])

  useEffect(() => {
    if (data?.comments?.nodes) {
      setComments(data.comments.nodes)
      if (data.comments.totalCount + 9 < page * limit) {
        setPage(1)
      }
    }
  }, [data?.comments])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('comments.overview.comments')}</h2>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px', gap: '8px', display: 'flex'}}>
          <Toggle
            defaultChecked={filter.states?.includes?.(CommentState.Approved)}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || []

                return {
                  ...f,
                  states: enabled
                    ? [...states, CommentState.Approved]
                    : states.filter(val => val !== CommentState.Approved)
                }
              })
            }
            checkedChildren={t('comments.state.approved')}
            unCheckedChildren={t('comments.state.approved')}
          />

          <Toggle
            defaultChecked={filter.states?.includes?.(CommentState.PendingApproval)}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || []

                return {
                  ...f,
                  states: enabled
                    ? [...states, CommentState.PendingApproval]
                    : states.filter(val => val !== CommentState.PendingApproval)
                }
              })
            }
            checkedChildren={t('comments.state.pendingApproval')}
            unCheckedChildren={t('comments.state.pendingApproval')}
          />

          <Toggle
            defaultChecked={filter.states?.includes?.(CommentState.PendingUserChanges)}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || []

                return {
                  ...f,
                  states: enabled
                    ? [...states, CommentState.PendingUserChanges]
                    : states.filter(val => val !== CommentState.PendingUserChanges)
                }
              })
            }
            checkedChildren={t('comments.state.pendingUserChanges')}
            unCheckedChildren={t('comments.state.pendingUserChanges')}
          />

          <Toggle
            defaultChecked={filter.states?.includes?.(CommentState.Rejected)}
            onChange={enabled =>
              setFilter(f => {
                const states = f.states || []

                return {
                  ...f,
                  states: enabled
                    ? [...states, CommentState.Rejected]
                    : states.filter(val => val !== CommentState.Rejected)
                }
              })
            }
            checkedChildren={t('comments.state.rejected')}
            unCheckedChildren={t('comments.state.rejected')}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px',
          gap: '20px'
        }}>
        <Table
          autoHeight
          rowHeight={60}
          rowClassName={rowData => {
            switch (rowData?.state) {
              case CommentState.Approved:
                return 'approved'
              case CommentState.PendingApproval:
                return 'pending-approval'
              case CommentState.PendingUserChanges:
                return 'pending-user'
              case CommentState.Rejected:
                return 'rejected'
              default:
                return ''
            }
          }}
          loading={isLoading}
          data={comments}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column width={350} align="left" verticalAlign="middle" resizable>
            <HeaderCell>{t('comments.overview.text')}</HeaderCell>
            <Cell dataKey="revisions">
              {(rowData: FullCommentFragment) => (
                <>
                  {rowData.revisions?.length ? (
                    <RichTextBlock
                      displayOnly
                      displayOneLine
                      disabled
                      onChange={() => {
                        return undefined
                      }}
                      value={rowData.revisions[rowData.revisions?.length - 1]?.text || []}
                    />
                  ) : null}
                </>
              )}
            </Cell>
          </Column>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column width={150} align="left" verticalAlign="middle" resizable>
            <HeaderCell>{t('comments.overview.userName')}</HeaderCell>
            <Cell>
              {(rowData: FullCommentFragment) => (
                <>{rowData.user ? rowData.user?.name : rowData.guestUsername}</>
              )}
            </Cell>
          </Column>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column width={150} align="left" verticalAlign="middle" resizable sortable>
            <HeaderCell>{t('comments.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: Comment) =>
                t('comments.overview.modifiedAtDate', {modifiedAtDate: new Date(modifiedAt)})
              }
            </Cell>
          </Column>

          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column width={200} align="right" verticalAlign="middle" fixed="right">
            <HeaderCell>{t('comments.overview.editState')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: FullCommentFragment) => (
                <PermissionControl qualifyingPermissions={['CAN_TAKE_COMMENT_ACTION']}>
                  <CommentStateDropdown
                    comment={rowData}
                    size="xs"
                    onStateChanged={async () => {
                      await refetch()
                    }}
                  />
                </PermissionControl>
              )}
            </Cell>
          </Column>

          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Column width={150} align="center" verticalAlign="middle" fixed="right">
            <HeaderCell>{t('comments.overview.action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: FullCommentFragment) => (
                <PermissionControl qualifyingPermissions={['CAN_UPDATE_COMMENTS']}>
                  {/* edit comment */}
                  <span style={{marginRight: '5px'}}>
                    <IconButtonTooltip caption={t('comments.overview.edit')}>
                      <Link to={`edit/${rowData.id}`}>
                        <IconButton icon={<MdEdit />} circle size="sm" />
                      </Link>
                    </IconButtonTooltip>
                  </span>

                  {/* reply to comment */}
                  <ReplyCommentBtn comment={rowData} size="sm" circle hideText />
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
      </div>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_COMMENTS',
  'CAN_TAKE_COMMENT_ACTION'
])(CommentList)
export {CheckedPermissionComponent as CommentList}
