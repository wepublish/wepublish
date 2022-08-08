import React, {useEffect, useState} from 'react'

import {Link, PageCreateRoute, PageEditRoute, ButtonLink, useRouteDispatch} from '../route'

import {
  PageRefFragment,
  usePageListQuery,
  useDeletePageMutation,
  useUnpublishPageMutation,
  useDuplicatePageMutation,
  PageListDocument,
  PageListQuery,
  PageSort
} from '../api'

import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Input,
  InputGroup,
  Table,
  IconButton,
  Modal,
  Button,
  Message,
  Pagination
} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {
  DEFAULT_TABLE_PAGE_SIZES,
  StateColor,
  mapTableSortTypeToGraphQLSortOrder,
  DEFAULT_MAX_TABLE_PAGES
} from '../utility'
import {PagePreviewLinkPanel} from '../panel/pagePreviewLinkPanel'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'
import CopyIcon from '@rsuite/icons/legacy/Copy'
import EyeIcon from '@rsuite/icons/legacy/Eye'
import BtnOffIcon from '@rsuite/icons/legacy/BtnOff'
import {RouteActionType} from '@wepublish/karma.run-react'

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

export function PageList() {
  const {t} = useTranslation()

  const [filter, setFilter] = useState('')

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

  const dispatch = useRouteDispatch()

  const pageListVariables = {
    filter: filter || undefined,
    first: limit,
    skip: page - 1,
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
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink appearance="primary" disabled={isLoading} route={PageCreateRoute.create({})}>
            {t('pages.overview.newPage')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
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
                <Link route={PageEditRoute.create({id: rowData.id})}>
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
                      dispatch({
                        type: RouteActionType.ReplaceRoute,
                        route: PageEditRoute.create({id: output.data?.duplicatePage.id})
                      })
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
