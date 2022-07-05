import React, {useEffect, useState} from 'react'
import {
  ArticleFilter,
  ArticleSort,
  PeerArticle,
  PeerWithProfileFragment,
  usePeerArticleListQuery,
  usePeerListQuery
} from '../api'

import {
  toaster,
  Message,
  Avatar,
  FlexboxGrid,
  Input,
  InputGroup,
  Popover,
  SelectPicker,
  Table,
  Whisper,
  Pagination
} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {Link} from '../route'
import {
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder,
  DEFAULT_MAX_TABLE_PAGES
} from '../utility'
import SearchIcon from '@rsuite/icons/legacy/Search'

export function PeerArticleList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('publishedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<ArticleFilter>({title: ''})
  const [allPeers, setAllPeers] = useState<PeerWithProfileFragment[]>([])
  const [peerFilter, setPeerFilter] = useState<string>()
  const [peerArticles, setPeerArticles] = useState<unknown[]>([])

  const listVariables = {
    filter: filter || undefined,
    first: limit,
    skip: page - 1,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    peerFilter: peerFilter
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

  // fetch all peers
  const {data: peerListData} = usePeerListQuery({
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (peerListData?.peers) {
      setAllPeers(peerListData.peers)
    }
  }, [peerListData?.peers])

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

        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter.title || ''} onChange={value => setFilter({title: value})} />
            <InputGroup.Addon>
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <SelectPicker
        virtualized
        data={allPeers.map(peer => ({
          value: peer.name,
          label: peer.profile?.name
        }))}
        style={{width: 150, marginTop: 10}}
        placeholder={t('peerArticles.filterByPeer')}
        searchable
        onSelect={value => setPeerFilter(value)}
        onClean={() => setPeerFilter('')}
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
                <Link href={rowData.peeredArticleURL} target="_blank">
                  {rowData.article.latest.title || t('articles.overview.untitled')}
                </Link>
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
                    src={rowData.peer.profile?.logo?.url || undefined}
                    alt={rowData.peer.profile?.name}
                    circle
                    size="xs"
                    style={{marginRight: 5, minWidth: 20}}
                    className="peerArticleAvatar"
                  />
                  <div>{rowData.peer.profile?.name}</div>
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
