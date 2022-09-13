import BtnOffIcon from '@rsuite/icons/legacy/BtnOff'
import CopyIcon from '@rsuite/icons/legacy/Copy'
import EyeIcon from '@rsuite/icons/legacy/Eye'
import SearchIcon from '@rsuite/icons/legacy/Search'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useNavigate} from 'react-router-dom'
import {
  Button,
  FlexboxGrid,
  IconButton,
  Input,
  InputGroup,
  Message,
  Modal,
  Pagination,
  Table
} from 'rsuite'

import {
  PageListDocument,
  PageListQuery,
  PageRefFragment,
  PageSort,
  useDeletePageMutation,
  useDuplicatePageMutation,
  usePageListQuery,
  useUnpublishPageMutation
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {PagePreviewLinkPanel} from '../panel/pagePreviewLinkPanel'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder,
  StateColor
} from '../utility'

const {Column, HeaderCell, Cell} = Table

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish',
  Duplicate = 'duplicate'
}

function mapColumFieldToGraphQLField(columnField: string): PageSort | null {
  switch (columnField) {
    case 'createdAt':
      return PageSort.CreatedAt
    case 'modifiedAt':
      return PageSort.ModifiedAt
    case 'publishAt':
      return PageSort.PublishAt
    default:
      return null
  }
}

function PageList() {
  const {t} = useTranslation()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<PageFilter>({title: ''})

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [isPagePreviewLinkOpen, setPagePreviewLinkOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('modifiedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pages, setPages] = useState<PageRefFragment[]>([])

  const [deletePage, {loading: isDeleting}] = useDeletePageMutation()
  const [unpublishPage, {loading: isUnpublishing}] = useUnpublishPageMutation()
  const [duplicatePage, {loading: isDuplicating}] = useDuplicatePageMutation()

  const pageListVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
  }

  const {data, refetch, loading: isLoading} = usePageListQuery({
    variables: pageListVariables,
    fetchPolicy: 'network-only'
  })

  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)

  useEffect(() => {
    const timerID = setTimeout(() => {
      setHighlightedRowId(null)
    }, 3000)
    return () => {
      clearTimeout(timerID)
    }
  }, [highlightedRowId])

  useEffect(() => {
    refetch(pageListVariables)
  }, [filter, page, limit, sortOrder, sortField])

  useEffect(() => {
    if (data?.pages?.nodes) {
      setPages(data.pages.nodes)
    }
  }, [data?.pages])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('pages.overview.pages')}</h2>
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
          <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
            <Link to="/pages/create">
              <Button appearance="primary" disabled={isLoading}>
                {t('pages.overview.newPage')}
              </Button>
            </Link>
          </FlexboxGrid.Item>
        </PermissionControl>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter.title || ''} onChange={value => setFilter({title: value})} />
            <InputGroup.Addon>
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          minHeight={600}
          autoHeight
          style={{flex: 1}}
          loading={isLoading}
          data={pages}
          sortColumn={sortField}
          sortType={sortOrder}
          rowClassName={rowData => (rowData?.id === highlightedRowId ? 'highlighted-row' : '')}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}>
          <Column width={210} align="left" resizable sortable>
            <HeaderCell>{t('pages.overview.publicationDate')}</HeaderCell>
            <Cell dataKey="published">
              {(pageRef: PageRefFragment) =>
                pageRef.published?.publishedAt
                  ? t('pageEditor.overview.publishedAt', {
                      publicationDate: new Date(pageRef.published.publishedAt)
                    })
                  : pageRef.pending?.publishAt
                  ? t('pageEditor.overview.publishedAtIfPending', {
                      publishedAtIfPending: new Date(pageRef.pending?.publishAt)
                    })
                  : t('pages.overview.notPublished')
              }
            </Cell>
          </Column>
          <Column width={210} align="left" resizable sortable>
            <HeaderCell>{t('pages.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: PageRefFragment) =>
                t('pageEditor.overview.modifiedAt', {
                  modificationDate: new Date(modifiedAt)
                })
              }
            </Cell>
          </Column>
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('pages.overview.title')}</HeaderCell>
            <Cell>
              {(rowData: PageRefFragment) => (
                <Link to={`/pages/edit/${rowData.id}`}>
                  {rowData.latest.title || t('pages.overview.untitled')}
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={100} align="left" resizable>
            <HeaderCell>{t('pages.overview.states')}</HeaderCell>
            <Cell>
              {(rowData: PageRefFragment) => {
                const states = []

                if (rowData.draft) states.push(t('pages.overview.draft'))
                if (rowData.pending) states.push(t('pages.overview.pending'))
                if (rowData.published) states.push(t('pages.overview.published'))

                return (
                  <div
                    style={{
                      textAlign: 'center',
                      borderRadius: '15px',
                      backgroundColor: rowData.pending
                        ? StateColor.pending
                        : rowData.published
                        ? StateColor.published
                        : rowData.draft
                        ? StateColor.draft
                        : StateColor.none
                    }}>
                    {states.join(' / ')}
                  </div>
                )
              }}
            </Cell>
          </Column>
          <Column width={200} align="center" fixed="right">
            <HeaderCell>{t('pages.overview.action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: PageRefFragment) => (
                <>
                  <PermissionControl qualifyingPermissions={['CAN_PUBLISH_PAGE']}>
                    <IconButtonTooltip caption={t('pageEditor.overview.unpublish')}>
                      <IconButton
                        icon={<BtnOffIcon />}
                        circle
                        disabled={!(rowData.published || rowData.pending)}
                        size="sm"
                        onClick={e => {
                          setCurrentPage(rowData)
                          setConfirmAction(ConfirmAction.Unpublish)
                          setConfirmationDialogOpen(true)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={['CAN_DELETE_PAGE']}>
                    <IconButtonTooltip caption={t('pageEditor.overview.delete')}>
                      <IconButton
                        icon={<TrashIcon />}
                        circle
                        size="sm"
                        style={{marginLeft: '5px'}}
                        onClick={() => {
                          setCurrentPage(rowData)
                          setConfirmAction(ConfirmAction.Delete)
                          setConfirmationDialogOpen(true)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
                    <IconButtonTooltip caption={t('pageEditor.overview.duplicate')}>
                      <IconButton
                        icon={<CopyIcon />}
                        circle
                        size="sm"
                        style={{marginLeft: '5px'}}
                        onClick={() => {
                          setCurrentPage(rowData)
                          setConfirmAction(ConfirmAction.Duplicate)
                          setConfirmationDialogOpen(true)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={['CAN_GET_PAGE_PREVIEW_LINK']}>
                    <IconButtonTooltip caption={t('pageEditor.overview.preview')}>
                      <IconButton
                        icon={<EyeIcon />}
                        disabled={!rowData.draft}
                        circle
                        size="sm"
                        style={{marginLeft: '5px'}}
                        onClick={() => {
                          setCurrentPage(rowData)
                          setPagePreviewLinkOpen(true)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
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
          total={data?.pages.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>

      <Modal open={isPagePreviewLinkOpen} size={'sm'} onClose={() => setPagePreviewLinkOpen(false)}>
        {currentPage && (
          <PagePreviewLinkPanel
            props={{id: currentPage.id}}
            onClose={() => setPagePreviewLinkOpen(false)}
          />
        )}
      </Modal>

      <Modal
        open={isConfirmationDialogOpen}
        size={'sm'}
        onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            {confirmAction === ConfirmAction.Unpublish
              ? t('pages.panels.unpublishPage')
              : confirmAction === ConfirmAction.Delete
              ? t('pages.panels.deletePage')
              : t('pages.panels.duplicatePage')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('pages.panels.title')}>
              {currentPage?.latest.title || t('pages.panels.untitled')}
            </DescriptionListItem>

            {currentPage?.latest.description && (
              <DescriptionListItem label={t('pages.panels.lead')}>
                {currentPage?.latest.description}
              </DescriptionListItem>
            )}

            <DescriptionListItem label={t('pages.panels.createdAt')}>
              {currentPage?.createdAt &&
                t('pages.panels.createdAtDate', {createdAtDate: new Date(currentPage.createdAt)})}
            </DescriptionListItem>

            <DescriptionListItem label={t('pages.panels.updatedAt')}>
              {currentPage?.latest.updatedAt &&
                t('pages.panels.updatedAtDate', {
                  updatedAtDate: new Date(currentPage.latest.updatedAt)
                })}
            </DescriptionListItem>

            {currentPage?.latest.publishedAt && (
              <DescriptionListItem label={t('pages.panels.publishedAt')}>
                {currentPage?.latest.publishedAt &&
                  t('pages.panels.publishedAtDate', {
                    publishedAtDate: new Date(currentPage.latest.publishedAt)
                  })}
              </DescriptionListItem>
            )}
          </DescriptionList>

          <Message showIcon type="warning" title={t('articleEditor.overview.warningLabel')}>
            {t('articleEditor.overview.unpublishWarningMessage')}
          </Message>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isUnpublishing || isDeleting || isDuplicating}
            onClick={async () => {
              if (!currentPage) return

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deletePage({
                    variables: {id: currentPage.id},
                    update: cache => {
                      const query = cache.readQuery<PageListQuery>({
                        query: PageListDocument,
                        variables: pageListVariables
                      })

                      if (!query) return

                      cache.writeQuery<PageListQuery>({
                        query: PageListDocument,
                        data: {
                          pages: {
                            ...query.pages,
                            nodes: query.pages.nodes.filter(page => page.id !== currentPage.id)
                          }
                        },
                        variables: pageListVariables
                      })
                    }
                  })
                  break

                case ConfirmAction.Unpublish:
                  await unpublishPage({
                    variables: {id: currentPage.id}
                  })
                  setHighlightedRowId(currentPage.id)
                  break

                case ConfirmAction.Duplicate:
                  duplicatePage({
                    variables: {id: currentPage.id},
                    update: cache => {
                      refetch(pageListVariables)
                      const query = cache.readQuery<PageListQuery>({
                        query: PageListDocument,
                        variables: pageListVariables
                      })

                      if (!query) return

                      cache.writeQuery<PageListQuery>({
                        query: PageListDocument,
                        data: {
                          pages: {
                            ...query.pages
                          }
                        },
                        variables: pageListVariables
                      })
                    }
                  }).then(output => {
                    if (output.data) {
                      navigate(`/pages/edit/${output.data?.duplicatePage.id}`, {replace: true})
                    }
                  })
                  break
              }

              setConfirmationDialogOpen(false)
            }}
            color="red">
            {t('pages.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('pages.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGES',
  'CAN_GET_PAGE',
  'CAN_CREATE_PAGE',
  'CAN_DELETE_PAGE',
  'CAN_PUBLISH_PAGE',
  'CAN_GET_PAGE_PREVIEW_LINK'
])(PageList)
export {CheckedPermissionComponent as PageList}
