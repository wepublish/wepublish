import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Avatar,
  FlexboxGrid,
  Message,
  Pagination,
  Popover,
  Table,
  toaster,
  Whisper,
  SelectPicker
} from 'rsuite'

import {
  ArticleFilter,
  ArticleSort,
  PeerArticle,
  useNewsroomListQuery,
  usePeerArticleListQuery
} from '../api'

import {createCheckedPermissionComponent} from '../atoms/permissionControl'
import {ListViewFilters} from '../atoms/searchAndFilter/listViewFilters'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../utility'

function PeerArticleList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('publishedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<ArticleFilter>({title: ''})
  // TODO fix type
  const [allPeers, setAllPeers] = useState<any[]>([])
  const [peerFilter, setPeerFilter] = useState<string>()
  const [peerArticles, setPeerArticles] = useState<unknown[]>([])

  const listVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    peerFilter
  }

  function mapColumFieldToGraphQLField(columnField: string): ArticleSort | null {
    switch (columnField) {
      case 'publishedAt':
        return ArticleSort.PublishedAt
      case 'modifiedAt':
        return ArticleSort.ModifiedAt
      case 'publishAt':
        return ArticleSort.PublishAt
      default:
        return null
    }
  }

  // fetch peered articles
  const {
    data: peerArticleListData,
    refetch,
    error: peerArticleListError,
    loading: isLoading
  } = usePeerArticleListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  // fetch all newsrooms
  const {data: newsroomListData} = useNewsroomListQuery({
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (newsroomListData?.newsrooms) {
      setAllPeers(newsroomListData.newsrooms.filter(newsroom => !newsroom.isSelf))
    }
  }, [newsroomListData?.newsrooms])

  useEffect(() => {
    if (peerArticleListData?.peerArticles.nodes) {
      setPeerArticles(peerArticleListData?.peerArticles.nodes)
    }
  }, [peerArticleListData?.peerArticles])

  const {t} = useTranslation()

  useEffect(() => {
    refetch(listVariables)
  }, [filter, page, limit, sortOrder, sortField, peerFilter])

  const {Column, HeaderCell, Cell} = Table

  useEffect(() => {
    if (peerArticleListError) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {peerArticleListError!.message}
        </Message>
      )
    }
  }, [peerArticleListError])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('peerArticles.peerArticles')}</h2>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <SelectPicker
        virtualized
        data={allPeers.map(peer => ({
          value: peer.name,
          label: peer?.name
        }))}
        style={{width: 150, marginTop: 10}}
        placeholder={t('peerArticles.filterByPeer')}
        searchable
        onSelect={value => setPeerFilter(value)}
        onClean={() => setPeerFilter('')}
      />

      <ListViewFilters
        fields={['title', 'preTitle', 'lead', 'peer', 'publicationDate']}
        filter={filter}
        isLoading={isLoading}
        onSetFilter={filter => setFilter(filter)}
        setPeerFilter={setPeerFilter}
      />

      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}
          minHeight={600}
          autoHeight
          style={{flex: 1}}
          loading={isLoading}
          data={peerArticles as any[]}
          sortColumn={sortField}
          sortType={sortOrder}>
          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.title')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <a href={rowData.peeredArticleURL} target="_blank" rel="noreferrer">
                  {rowData.article.latest.title || t('articles.overview.untitled')}
                </a>
              )}
            </Cell>
          </Column>

          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.lead')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) =>
                rowData.article.latest.lead || t('articles.overview.untitled')
              }
            </Cell>
          </Column>

          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('peerArticles.publishedAt')}</HeaderCell>
            <Cell dataKey="publishedAt">
              {(rowData: PeerArticle) =>
                rowData.article.latest.publishedAt
                  ? t('peerArticles.publicationDate', {
                      publicationDate: new Date(rowData.article.latest.publishedAt)
                    })
                  : t('peerArticles.notPublished')
              }
            </Cell>
          </Column>

          <Column width={150} align="left" resizable>
            <HeaderCell>{t('peerArticles.peer')}</HeaderCell>
            <Cell dataKey="peer" style={{display: 'flex'}}>
              {(rowData: PeerArticle) => (
                <>
                  <Avatar
                    src={rowData.peer?.logo?.url || undefined}
                    alt={rowData.peer?.name}
                    circle
                    size="xs"
                    style={{marginRight: 5, minWidth: 20}}
                    className="peerArticleAvatar"
                  />
                  <div>{rowData.peer?.name}</div>
                </>
              )}
            </Cell>
          </Column>

          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.authors')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => {
                return rowData.article.latest.authors.reduce((allAuthors, author, index) => {
                  return `${allAuthors}${index !== 0 ? ', ' : ''}${author?.name}`
                }, '')
              }}
            </Cell>
          </Column>

          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.articleImage')}</HeaderCell>

            <Cell>
              {(rowData: PeerArticle) =>
                rowData.article.latest.image?.url ? (
                  <Whisper
                    placement="left"
                    trigger="hover"
                    controlId="control-id-hover"
                    speaker={
                      <Popover>
                        <img
                          src={rowData.article.latest.image?.url || ''}
                          alt=""
                          style={{height: '175', width: 'auto'}}
                        />
                      </Popover>
                    }>
                    <img
                      src={rowData.article.latest.image?.url || ''}
                      alt=""
                      style={{height: '25', width: 'auto'}}
                    />
                  </Whisper>
                ) : (
                  ''
                )
              }
            </Cell>
          </Column>

          {/* This section will be uncommented when the hostURL is available. See this issue: https://wepublish.atlassian.net/browse/WPC-663}
          {/* <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.originalArticle')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <Link href={rowData.article.latest?.url ?? rowData.peer.hostURL} target="blank">
                  {t('peerArticles.toOriginalArticle')}
                </Link>
              )}
            </Cell>
          </Column> */}
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
          total={peerArticleListData?.peerArticles?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSROOMS',
  'CAN_GET_NEWSROOM'
])(PeerArticleList)
export {CheckedPermissionComponent as PeerArticleList}
