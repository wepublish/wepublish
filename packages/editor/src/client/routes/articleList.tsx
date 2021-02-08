import React, {useEffect, useState} from 'react'

import {ArticleCreateRoute, Link, ArticleEditRoute, ButtonLink} from '../route'

import {
  useArticleListQuery,
  ArticleRefFragment,
  useUnpublishArticleMutation,
  useDeleteArticleMutation,
  ArticleListDocument,
  ArticleListQuery,
  PageRefFragment,
  ArticleSort
} from '../api'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Input, InputGroup, Icon, IconButton, Table, Modal, Button} from 'rsuite'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'
const {Column, HeaderCell, Cell, Pagination} = Table

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
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
  const [currentArticle, setCurrentArticle] = useState<ArticleRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [articles, setArticles] = useState<ArticleRefFragment[]>([])

  const [deleteArticle, {loading: isDeleting}] = useDeleteArticleMutation()
  const [unpublishArticle, {loading: isUnpublishing}] = useUnpublishArticleMutation()

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
              <Icon icon="search" />
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
          autoHeight={true}
          style={{flex: 1}}
          loading={isLoading}
          data={articles}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType)
            setSortField(sortColumn)
          }}>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('articles.overview.created')}</HeaderCell>
            <Cell dataKey="createdAt">
              {({createdAt}: ArticleRefFragment) => new Date(createdAt).toDateString()}
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('articles.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: ArticleRefFragment) => new Date(modifiedAt).toDateString()}
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
          <Column width={100} align="left" resizable>
            <HeaderCell>{t('articles.overview.states')}</HeaderCell>
            <Cell>
              {(rowData: PageRefFragment) => {
                const states = []

                if (rowData.draft) states.push(t('articles.overview.draft'))
                if (rowData.pending) states.push(t('articles.overview.pending'))
                if (rowData.published) states.push(t('articles.overview.published'))

                return <div>{states.join(' / ')}</div>
              }}
            </Cell>
          </Column>
          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('articles.overview.action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: ArticleRefFragment) => (
                <>
                  {rowData.published && (
                    <IconButton
                      icon={<Icon icon="arrow-circle-o-down" />}
                      circle
                      size="sm"
                      onClick={e => {
                        setCurrentArticle(rowData)
                        setConfirmAction(ConfirmAction.Unpublish)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  )}
                  <IconButton
                    icon={<Icon icon="trash" />}
                    circle
                    size="sm"
                    style={{marginLeft: '5px'}}
                    onClick={() => {
                      setCurrentArticle(rowData)
                      setConfirmAction(ConfirmAction.Delete)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                </>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          style={{height: '50px'}}
          lengthMenu={DEFAULT_TABLE_PAGE_SIZES}
          activePage={page}
          displayLength={limit}
          total={data?.articles.totalCount}
          onChangePage={page => setPage(page)}
          onChangeLength={limit => setLimit(limit)}
        />
      </div>

      <Modal
        show={isConfirmationDialogOpen}
        width={'sm'}
        onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            {confirmAction === ConfirmAction.Unpublish
              ? t('articles.panels.unpublishArticle')
              : t('articles.panels.deleteArticle')}
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
              {currentArticle?.createdAt && new Date(currentArticle.createdAt).toLocaleString()}
            </DescriptionListItem>

            <DescriptionListItem label={t('articles.panels.updatedAt')}>
              {currentArticle?.latest.updatedAt &&
                new Date(currentArticle.latest.updatedAt).toLocaleString()}
            </DescriptionListItem>

            {currentArticle?.latest.publishedAt && (
              <DescriptionListItem label={t('articles.panels.publishedAt')}>
                {new Date(currentArticle.createdAt).toLocaleString()}
              </DescriptionListItem>
            )}
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            color={'red'}
            disabled={isUnpublishing || isDeleting}
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
