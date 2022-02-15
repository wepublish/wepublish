import React, {useEffect, useState} from 'react'
import {Peer, PeerArticle, usePeerArticleListQuery, usePeerListQuery} from '../api'

import {
  Avatar,
  FlexboxGrid,
  Icon,
  Input,
  InputGroup,
  Notification,
  SelectPicker,
  Table
} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {Link} from '../route'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'

export function PeerArticleList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('modifiedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')

  const [allPeers, setAllPeers] = useState<Peer[]>([])

  const listVariables = {
    filter: filter || undefined,
    first: limit,
    skip: page - 1,
    // sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
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

  // fetch peered articles with filter by peer option
  // which query ? Create new query ?
  const {data: filterByPeerPeerListData, error: peerListError} = usePeerArticleListQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore'
  })

  console.log('PeerListData', peerListData)

  useEffect(() => {
    if (peerListData?.peers) {
      setAllPeers(peerListData?.peers)
    }
  }, [peerListData?.peers])

  const {t} = useTranslation()

  useEffect(() => {
    refetch(listVariables)
  }, [filter, page, limit, sortOrder, sortField])

  // console.log('peerARticleListData:  ', peerArticleListData)

  const peerArticles = peerArticleListData?.peerArticles.nodes ?? []

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
      value: 'bajour',
      label: 'bajour',
      blah: 'blah'
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
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <SelectPicker
        label={'Peer'}
        // data={fakeData}
        data={allPeers.map(peer => ({
          value: peer.id,
          label: peer.profile?.name
        }))}
        style={{width: 150, marginTop: 10}}
        placeholder={'Filter by peer'}
        searchable={false}></SelectPicker>

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
          data={peerArticles}
          sortColumn={sortField}
          sortType={sortOrder}
          // rowClassName={rowData => (rowData?.id === highlightedRowId ? 'highlighted-row' : '')}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType)
            setSortField(sortColumn)
          }}
          {...console.log(peerArticles)}>
          {/* Show only published articles ? */}

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

          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.publishedAt')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) =>
                rowData.article.published
                  ? t('peerArticles.publicationDate', {
                      publicationDate: new Date(rowData.article.latest.publishedAt)
                    })
                  : 'not published'
              }
            </Cell>
          </Column>

          {/* alignement */}
          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.peer')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <>
                  <Avatar
                    src={rowData.peer.profile?.logo?.url || undefined}
                    alt=""
                    circle
                    size="xs"
                  />
                  {rowData.peer.profile?.name}
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

          {/* add hover */}
          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.articleImage')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) =>
                rowData.article.latest.image?.url ? (
                  <img
                    src={rowData.article.latest.image?.url || ''}
                    alt=""
                    style={{height: '25', width: 'auto'}}
                  />
                ) : (
                  ''
                )
              }
            </Cell>
          </Column>

          {/* Build url depending on which peer ?  */}
          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.originalArticle')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <Link href={rowData.peer.hostURL} target="blank">
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
