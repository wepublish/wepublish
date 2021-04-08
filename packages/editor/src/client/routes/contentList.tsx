import React, {useEffect, useState} from 'react'
import {Link, ButtonLink, ContentCreateRoute, ContentEditRoute} from '../route'
import {useRoute} from '../route'
import {
  useUnpublishContentMutation,
  PageRefFragment,
  useContentListQuery,
  ContentListQuery,
  ContentListRefFragment
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Input, InputGroup, Icon, IconButton, Table, Modal, Button} from 'rsuite'
import {getDeleteMutation} from '../utils/queryUtils'
import {useMutation} from '@apollo/client'
const {Column, HeaderCell, Cell} = Table
import {Content} from '@wepublish/api'
import {EditorConfig} from '../interfaces/extensionConfig'

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

const RecordsPerPage = 10

export interface ArticleEditorProps {
  readonly contentTypeList: EditorConfig
}

export function ContentList({contentTypeList}: ArticleEditorProps) {
  const {current} = useRoute()
  const type = (current?.params as any).type || ''
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentContent, setCurrentContent] = useState<Content>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const config = contentTypeList.contentModelExtension.find(config => {
    return config.identifier === type
  })
  if (!config) {
    throw Error(`Content type ${type} not supported`)
  }

  const [articles, setArticles] = useState<any[]>([])

  const [unpublishArticle, {loading: isUnpublishing}] = useUnpublishContentMutation()
  const [deleteContent, {loading: isDeleting}] = useMutation(getDeleteMutation(config))

  const listVariables = {type, filter: filter || undefined, first: RecordsPerPage}
  const {data, fetchMore, loading: isLoading, refetch} = useContentListQuery({
    variables: listVariables,
    skip: !type,
    fetchPolicy: 'network-only'
  })

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.content._all.list.nodes) {
      setArticles(data?.content._all.list.nodes.map(a => a.content))
    }
  }, [data?.content._all.list])

  function loadMore() {
    fetchMore({
      variables: {...listVariables, after: data?.content._all.list.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          content: {
            _all: {
              list: {
                ...(fetchMoreResult as ContentListQuery).content._all.list,
                nodes: [
                  ...(prev as ContentListQuery).content._all.list.nodes,
                  ...(fetchMoreResult as ContentListQuery)?.content._all.list.nodes
                ]
              }
            }
          }
        }
      }
    })
  }

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{config.namePlural}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={ContentCreateRoute.create({type})}>
            {`New ${type}`}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
            <Input value={filter} onChange={value => setFilter(value)} />
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table style={{marginTop: '20px'}} loading={isLoading} data={articles}>
        <Column flexGrow={3} align="left">
          <HeaderCell>{t('articles.overview.title')}</HeaderCell>
          <Cell>
            {(rowData: ContentListRefFragment) => {
              return (
                <Link route={ContentEditRoute.create({type, id: rowData.id})}>
                  {rowData.title || t('articles.overview.untitled')}
                </Link>
              )
            }}
          </Cell>
        </Column>
        <Column flexGrow={2} minWidth={140} align="left">
          <HeaderCell>{t('articles.overview.created')}</HeaderCell>
          <Cell dataKey="createdAt" />
        </Column>
        <Column flexGrow={2} minWidth={140} align="left">
          <HeaderCell>{t('articles.overview.updated')}</HeaderCell>
          <Cell dataKey="modifiedAt" />
        </Column>
        <Column flexGrow={2} align="left">
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
        <Column width={90} align="right" fixed="right">
          <HeaderCell>{t('articles.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: Content) => (
              <>
                {rowData && (
                  <IconButton
                    icon={<Icon icon="arrow-circle-o-down" />}
                    circle
                    size="sm"
                    onClick={e => {
                      setCurrentContent(rowData)
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
                    setCurrentContent(rowData)
                    setConfirmAction(ConfirmAction.Delete)
                    setConfirmationDialogOpen(true)
                  }}
                />
              </>
            )}
          </Cell>
        </Column>
      </Table>

      {data?.content._all.list.pageInfo.hasNextPage && (
        <Button style={{height: '80px'}} label={t('articles.overview.loadMore')} onClick={loadMore}>
          load more
        </Button>
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
              {currentContent?.title || t('articles.panels.untitled')}
            </DescriptionListItem>

            <DescriptionListItem label={t('articles.panels.createdAt')}>
              {currentContent?.createdAt && new Date(currentContent.createdAt).toLocaleString()}
            </DescriptionListItem>

            {/* <DescriptionListItem label={t('articles.panels.updatedAt')}>
              {currentArticle?.updatedAt &&
                new Date(currentArticle.updatedAt).toLocaleString()}
            </DescriptionListItem> */}

            {/* {currentArticle?.publishedAt && (
              <DescriptionListItem label={t('articles.panels.publishedAt')}>
                {new Date(currentArticle.createdAt).toLocaleString()}
              </DescriptionListItem>
            )} */}
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            color={'red'}
            disabled={isUnpublishing || isDeleting}
            onClick={async () => {
              if (!currentContent) return

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deleteContent({
                    variables: {id: currentContent.id}
                  })
                  await refetch()
                  break

                case ConfirmAction.Unpublish:
                  await unpublishArticle({
                    variables: {id: currentContent.id}
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
