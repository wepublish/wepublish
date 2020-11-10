import React, {useEffect, useState} from 'react'

import {ArticleCreateRoute, Link, ArticleEditRoute, ButtonLink} from '../route'

import {
  useArticleListQuery,
  ArticleRefFragment,
  useUnpublishArticleMutation,
  useDeleteArticleMutation,
  ArticleListDocument,
  ArticleListQuery,
  PageRefFragment
} from '../api'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Input, InputGroup, Icon, IconButton, Table, Modal, Button} from 'rsuite'
const {Column, HeaderCell, Cell} = Table

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

const ArticlesPerPage = 50

export function ArticleList() {
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<ArticleRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [articles, setArticles] = useState<ArticleRefFragment[]>([])

  const [deleteArticle, {loading: isDeleting}] = useDeleteArticleMutation()
  const [unpublishArticle, {loading: isUnpublishing}] = useUnpublishArticleMutation()

  const listVariables = {filter: filter || undefined, first: ArticlesPerPage}
  const {data, fetchMore, loading: isLoading} = useArticleListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })
  const {t} = useTranslation()

  useEffect(() => {
    if (data?.articles.nodes) {
      setArticles(data.articles.nodes)
    }
  }, [data?.articles])

  function loadMore() {
    fetchMore({
      variables: {...listVariables, after: data?.articles.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          articles: {
            ...fetchMoreResult.articles,
            nodes: [...prev.articles.nodes, ...fetchMoreResult?.articles.nodes]
          }
        }
      }
    })
  }

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

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={articles}>
        <Column width={400} align="left" resizable>
          <HeaderCell>Titel</HeaderCell>
          <Cell>
            {(rowData: PageRefFragment) => (
              <Link route={ArticleEditRoute.create({id: rowData.id})}>
                {rowData.latest.title || t('articles.overview.untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>Created</HeaderCell>
          <Cell dataKey="createdAt" />
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>Modified</HeaderCell>
          <Cell dataKey="modifiedAt" />
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>State</HeaderCell>
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
          <HeaderCell>Action</HeaderCell>
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
                    setConfirmationDialogOpen(true)
                    setConfirmAction(ConfirmAction.Delete)
                    setConfirmationDialogOpen(true)
                  }}
                />
              </>
            )}
          </Cell>
        </Column>
      </Table>

      {data?.articles.pageInfo.hasNextPage && (
        <Button label={t('articles.overview.loadMore')} onClick={loadMore} />
      )}

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
                        variables: listVariables
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
                        variables: listVariables
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
