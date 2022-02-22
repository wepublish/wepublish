import React, {useEffect, useState} from 'react'
import {
  ArticleFilter,
  ArticleSort,
  Peer,
  PeerArticle,
  usePeerArticleListQuery,
  usePeerListQuery
} from '../api'

import {
  Avatar,
  FlexboxGrid,
  Icon,
  Input,
  InputGroup,
  Notification,
  Popover,
  SelectPicker,
  Table,
  Whisper
} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {Link} from '../route'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'

export function PeerArticleList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('publishedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<ArticleFilter>({title: ''})

  const [allPeers, setAllPeers] = useState<Peer[]>([])

  const [peerFilter, setPeerFilter] = useState<string>('Demo')

  const [peerArticles, setPeerArticles] = useState<PeerArticle[]>()

  const listVariables = {
    filter: filter || undefined,
    first: limit,
    skip: page - 1,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    peerFilter: peerFilter
  }

  // console.log('filter', filter)

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
  const {data: peerListData, error: peerListError} = usePeerListQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore'
  })

  console.log('PeerListData', peerListData)
  console.log('PeerArticleListData', peerArticleListData)

  useEffect(() => {
    if (peerListData?.peers) {
      // should be an array
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
    // console.log(filter)
    console.log('peerFilter: ', peerFilter)
  }, [filter, page, limit, sortOrder, sortField, peerFilter])

  // console.log('peerARticleListData:  ', peerArticleListData)
  // const peerArticles = peerArticleListData?.peerArticles.nodes ?? []

  const {Column, HeaderCell, Cell, Pagination} = Table

  useEffect(() => {
    if (peerArticleListError) {
      Notification.error({
        title: peerArticleListError!.message,
        duration: 5000
      })
    }
  }, [peerArticleListError])

  const fakeData = [
    {
      value: 'demo',
      label: 'demo',
      blah: 'demo'
    },
    {
      value: 'tsüri',
      label: 'tsüri',
      blah: 'bluh'
    }
  ]

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
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <SelectPicker
        label={'peer'}
        // data={fakeData}
        data={allPeers.map(peer => ({
          value: peer.name,
          label: peer.profile?.name
        }))}
        style={{width: 150, marginTop: 10}}
        placeholder={'Filter by peer'}
        searchable={false}
        onChange={value => setPeerFilter(value)}></SelectPicker>

      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          onSortColumn={(sortColumn, sortType) => {
            console.log('sort', sortColumn, sortType)
            setSortOrder(sortType)
            setSortField(sortColumn)
          }}
          minHeight={600}
          autoHeight={true}
          style={{flex: 1}}
          loading={isLoading}
          data={peerArticles}
          sortColumn={sortField}
          sortType={sortOrder}
          // rowClassName={rowData => (rowData?.id === highlightedRowId ? 'highlighted-row' : '')}
        >
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

          {/* sort doesn't work */}

          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('peerArticles.publishedAt')}</HeaderCell>
            <Cell dataKey="publishedAt">
              {
                (rowData: PeerArticle) =>
                  rowData.article.latest.publishedAt
                    ? // latest publish instead of published
                      t('peerArticles.publicationDate', {
                        publicationDate: new Date(rowData.article.latest.publishedAt ?? '')
                      })
                    : 'not published'
                // change for translation or state
              }
            </Cell>
          </Column>

          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.peer')}</HeaderCell>
            <Cell dataKey="peer" style={{display: 'flex'}}>
              {(rowData: PeerArticle) => (
                <>
                  <Avatar
                    src={rowData.peer.profile?.logo?.url || undefined}
                    alt=""
                    circle
                    size="xs"
                    style={{marginRight: 5}}
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

          {/* add canonical url when available */}
          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.originalArticle')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <Link
                  href={rowData.article.latest.canonicalUrl ?? 'https://google.ch'}
                  target="blank">
                  {t('peerArticles.toOriginalArticle')}
                </Link>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          style={{height: '50px'}}
          lengthMenu={DEFAULT_TABLE_PAGE_SIZES}
          activePage={page}
          displayLength={limit}
          total={peerArticleListData?.peerArticles.totalCount}
          onChangePage={page => setPage(page)}
          onChangeLength={limit => setLimit(limit)}
        />
      </div>
    </>
  )
}
