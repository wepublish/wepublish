import React, {useEffect, useState} from 'react'

import {Link, PageCreateRoute, PageEditRoute, ButtonLink} from '../route'

import {
  PageRefFragment,
  usePageListQuery,
  useDeletePageMutation,
  useUnpublishPageMutation,
  PageListDocument,
  PageListQuery
} from '../api'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Input, InputGroup, Icon, Table, IconButton, Modal, Button} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
const {Column, HeaderCell, Cell} = Table

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

const PagesPerPage = 50

export function PageList() {
  const {t} = useTranslation()

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [pages, setPages] = useState<PageRefFragment[]>([])

  const [deletePage, {loading: isDeleting}] = useDeletePageMutation()
  const [unpublishPage, {loading: isUnpublishing}] = useUnpublishPageMutation()

  const listVariables = {filter: filter || undefined, first: PagesPerPage}
  const {data, fetchMore, loading: isLoading} = usePageListQuery({
    variables: {filter: filter || undefined, first: 50},
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (data?.pages?.nodes) {
      setPages(data.pages.nodes)
    }
  }, [data?.pages])

  function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.pages.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          pages: {
            ...fetchMoreResult.pages,
            nodes: [...prev.pages.nodes, ...fetchMoreResult?.pages.nodes]
          }
        }
      }
    })
  }

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
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={pages}>
        <Column width={400} align="left" resizable>
          <HeaderCell>Titel</HeaderCell>
          <Cell>
            {(rowData: PageRefFragment) => (
              <Link route={PageEditRoute.create({id: rowData.id})}>
                {rowData.latest.title || t('pages.overview.untitled')}
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

              if (rowData.draft) states.push(t('pages.overview.draft'))
              if (rowData.pending) states.push(t('pages.overview.pending'))
              if (rowData.published) states.push(t('pages.overview.published'))

              return <div>{states.join(' / ')}</div>
            }}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>Action</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: PageRefFragment) => (
              <>
                {rowData.published && (
                  <IconButton
                    icon={<Icon icon="arrow-circle-o-down" />}
                    circle
                    size="sm"
                    onClick={e => {
                      setCurrentPage(rowData)
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
                    setCurrentPage(rowData)
                    setConfirmAction(ConfirmAction.Delete)
                    setConfirmationDialogOpen(true)
                  }}
                />
              </>
            )}
          </Cell>
        </Column>
      </Table>

      {data?.pages.pageInfo.hasNextPage && (
        <Button onClick={loadMore}>{t('pages.overview.loadMore')}</Button>
      )}

      <Modal
        show={isConfirmationDialogOpen}
        width={'sm'}
        onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            {confirmAction === ConfirmAction.Unpublish
              ? t('pages.panels.unpublishPage')
              : t('pages.panels.deletePage')}
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
              {currentPage?.createdAt && new Date(currentPage.createdAt).toLocaleString()}
            </DescriptionListItem>

            <DescriptionListItem label={t('pages.panels.updatedAt')}>
              {currentPage?.latest.updatedAt &&
                new Date(currentPage.latest.updatedAt).toLocaleString()}
            </DescriptionListItem>

            {currentPage?.latest.publishedAt && (
              <DescriptionListItem label={t('pages.panels.publishedAt')}>
                {currentPage?.latest.publishedAt &&
                  new Date(currentPage.createdAt).toLocaleString()}
              </DescriptionListItem>
            )}
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isUnpublishing || isDeleting}
            onClick={async () => {
              if (!currentPage) return

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deletePage({
                    variables: {id: currentPage.id},
                    update: cache => {
                      const query = cache.readQuery<PageListQuery>({
                        query: PageListDocument,
                        variables: listVariables
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
                        variables: listVariables
                      })
                    }
                  })
                  break

                case ConfirmAction.Unpublish:
                  await unpublishPage({
                    variables: {id: currentPage.id}
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
