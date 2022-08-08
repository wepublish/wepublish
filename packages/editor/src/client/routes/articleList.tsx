import React, {useEffect, useState} from 'react'

import {ArticleCreateRoute, Link, ArticleEditRoute, ButtonLink, useRouteDispatch} from '../route'

import {
  useArticleListQuery,
  ArticleRefFragment,
  useUnpublishArticleMutation,
  useDeleteArticleMutation,
  useDuplicateArticleMutation,
  ArticleListDocument,
  ArticleListQuery,
  PageRefFragment,
  ArticleSort
} from '../api'

import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Input,
  InputGroup,
  IconButton,
  Table,
  Modal,
  Button,
  Message,
  Pagination
} from 'rsuite'
import {
  DEFAULT_TABLE_PAGE_SIZES,
  StateColor,
  mapTableSortTypeToGraphQLSortOrder,
  DEFAULT_MAX_TABLE_PAGES
} from '../utility'
import {ArticlePreviewLinkPanel} from '../panel/articlePreviewLinkPanel'
import SearchIcon from '@rsuite/icons/legacy/Search'
import TrashIcon from '@rsuite/icons/legacy/Trash'
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

function mapColumFieldToGraphQLField(columnField: string): ArticleSort | null {
  switch (columnField) {
    case 'createdAt':
      return ArticleSort.CreatedAt
    case 'modifiedAt':
      return ArticleSort.ModifiedAt
    case 'publishAt':
      return ArticleSort.PublishAt
    default:
      return null
  }
}

export function ArticleList() {
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [isArticlePreviewLinkOpen, setArticlePreviewLinkOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<ArticleRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('modifiedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [articles, setArticles] = useState<ArticleRefFragment[]>([])

  const [deleteArticle, {loading: isDeleting}] = useDeleteArticleMutation()
  const [unpublishArticle, {loading: isUnpublishing}] = useUnpublishArticleMutation()
  const [duplicateArticle, {loading: isDuplicating}] = useDuplicateArticleMutation()

  const dispatch = useRouteDispatch()

  const articleListVariables = {
    filter: filter || undefined,
    first: limit,
    skip: page - 1,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
  }

  const {data, refetch, loading: isLoading} = useArticleListQuery({
    variables: articleListVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch(articleListVariables)
  }, [filter, page, limit, sortOrder, sortField])

  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)

  useEffect(() => {
    const timerID = setTimeout(() => {
      setHighlightedRowId(null)
    }, 3000)
    return () => {
      clearTimeout(timerID)
    }
  }, [highlightedRowId])

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.articles.nodes) {
      setArticles(data.articles.nodes)
    }
  }, [data?.articles])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('articles.overview.articles')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={ArticleCreateRoute.create({})}>
            {t('articles.overview.newArticle')}
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
          data={articles}
          sortColumn={sortField}
          sortType={sortOrder}
          rowClassName={rowData => (rowData?.id === highlightedRowId ? 'highlighted-row' : '')}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}>
          <Column width={210} align="left" resizable sortable>
            <HeaderCell>{t('articles.overview.publicationDate')}</HeaderCell>
            <Cell dataKey="published">
              {(articleRef: ArticleRefFragment) =>
                articleRef.published?.publishedAt
                  ? t('articleEditor.overview.publishedAt', {
                      publicationDate: new Date(articleRef.published.publishedAt)
                    })
                  : articleRef.pending?.publishAt
                  ? t('articleEditor.overview.publishedAtIfPending', {
                      publishedAtIfPending: new Date(articleRef.pending?.publishAt)
                    })
                  : t('articles.overview.notPublished')
              }
            </Cell>
          </Column>
          <Column width={210} align="left" resizable sortable>
            <HeaderCell>{t('articles.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: ArticleRefFragment) =>
                t('articleEditor.overview.modifiedAt', {
                  modificationDate: new Date(modifiedAt)
                })
              }
            </Cell>
          </Column>
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('articles.overview.title')}</HeaderCell>
            <Cell>
              {(rowData: ArticleRefFragment) => (
                <Link route={ArticleEditRoute.create({id: rowData.id})}>
                  {rowData.latest.title || t('articles.overview.untitled')}
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={200} align="left" resizable>
            <HeaderCell>{t('articles.overview.authors')}</HeaderCell>
            <Cell>
              {(rowData: ArticleRefFragment) => {
                return rowData.latest.authors.reduce((allAuthors, author, index) => {
                  return `${allAuthors}${index !== 0 ? ', ' : ''}${author?.name}`
                }, '')
              }}
            </Cell>
          </Column>
          <Column width={150} align="left" resizable>
            <HeaderCell>{t('articles.overview.states')}</HeaderCell>
            <Cell>
              {(rowData: PageRefFragment) => {
                const states = []

                if (rowData.draft) states.push(t('articles.overview.draft'))
                if (rowData.pending) states.push(t('articles.overview.pending'))
                if (rowData.published) states.push(t('articles.overview.published'))

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
            <HeaderCell>{t('articles.overview.action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: ArticleRefFragment) => (
                <>
                  <IconButtonTooltip caption={t('articleEditor.overview.unpublish')}>
                    <IconButton
                      icon={<BtnOffIcon />}
                      circle
                      disabled={!(rowData.published || rowData.pending)}
                      size="sm"
                      onClick={e => {
                        setCurrentArticle(rowData)
                        setConfirmAction(ConfirmAction.Unpublish)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>

                  <IconButtonTooltip caption={t('articleEditor.overview.delete')}>
                    <IconButton
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentArticle(rowData)
                        setConfirmAction(ConfirmAction.Delete)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('articleEditor.overview.duplicate')}>
                    <IconButton
                      icon={<CopyIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentArticle(rowData)
                        setConfirmAction(ConfirmAction.Duplicate)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('articleEditor.overview.preview')}>
                    <IconButton
                      icon={<EyeIcon />}
                      circle
                      disabled={!rowData.draft}
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentArticle(rowData)
                        setArticlePreviewLinkOpen(true)
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
          total={data?.articles.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>

      <Modal
        open={isArticlePreviewLinkOpen}
        size={'sm'}
        onClose={() => setArticlePreviewLinkOpen(false)}>
        {currentArticle && (
          <ArticlePreviewLinkPanel
            props={{id: currentArticle.id}}
            onClose={() => setArticlePreviewLinkOpen(false)}
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
              ? t('articles.panels.unpublishArticle')
              : confirmAction === ConfirmAction.Delete
              ? t('articles.panels.deleteArticle')
              : t('articles.panels.duplicateArticle')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('articles.panels.title')}>
              {currentArticle?.latest.title || t('articles.panels.untitled')}
            </DescriptionListItem>

            {currentArticle?.latest.lead && (
              <DescriptionListItem label={t('articles.panels.lead')}>
                {currentArticle?.latest.lead}
              </DescriptionListItem>
            )}

            <DescriptionListItem label={t('articles.panels.createdAt')}>
              {currentArticle?.createdAt &&
                t('articles.panels.createdAtDate', {
                  createdAtDate: new Date(currentArticle.createdAt)
                })}
            </DescriptionListItem>

            <DescriptionListItem label={t('articles.panels.updatedAt')}>
              {currentArticle?.latest.updatedAt &&
                t('articles.panels.updatedAtDate', {
                  updatedAtDate: new Date(currentArticle.latest.updatedAt)
                })}
            </DescriptionListItem>

            {currentArticle?.latest.publishedAt && (
              <DescriptionListItem label={t('articles.panels.publishedAt')}>
                {t('articles.panels.publishedAtDate', {
                  publishedAtDate: new Date(currentArticle.latest.publishedAt)
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
            color={'red'}
            disabled={isUnpublishing || isDeleting || isDuplicating}
            onClick={async () => {
              if (!currentArticle) return

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deleteArticle({
                    variables: {id: currentArticle.id},
                    update: cache => {
                      const query = cache.readQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        variables: articleListVariables
                      })

                      if (!query) return

                      cache.writeQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        data: {
                          articles: {
                            ...query.articles,
                            nodes: query.articles.nodes.filter(
                              article => article.id !== currentArticle.id
                            )
                          }
                        },
                        variables: articleListVariables
                      })
                    }
                  })
                  break

                case ConfirmAction.Unpublish:
                  await unpublishArticle({
                    variables: {id: currentArticle.id}
                  })
                  setHighlightedRowId(currentArticle.id)
                  break

                case ConfirmAction.Duplicate:
                  duplicateArticle({
                    variables: {id: currentArticle.id},
                    update: cache => {
                      refetch(articleListVariables)
                      const query = cache.readQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        variables: articleListVariables
                      })

                      if (!query) return
                      cache.writeQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        data: {
                          articles: {
                            ...query.articles
                          }
                        },
                        variables: articleListVariables
                      })
                    }
                  }).then(output => {
                    if (output.data) {
                      dispatch({
                        type: RouteActionType.ReplaceRoute,
                        route: ArticleEditRoute.create({id: output.data?.duplicateArticle.id})
                      })
                    }
                  })
                  break
              }

              setConfirmationDialogOpen(false)
            }}>
            {t('articles.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('articles.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
