import styled from '@emotion/styled'
import {
  ArticleFilter,
  ArticleSort,
  PeerArticle,
  usePeerArticleListQuery
} from '@wepublish/editor/api'
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Avatar as RAvatar,
  Message,
  Pagination,
  Popover,
  Table as RTable,
  toaster,
  Whisper
} from 'rsuite'
import {RowDataType} from 'rsuite-table'

const {Column, HeaderCell, Cell: RCell} = RTable

const Img = styled.img`
  height: 25px;
  width: auto;
`

const PopoverImg = styled.img`
  height: 175px;
  width: auto;
`

const Avatar = styled(RAvatar)`
  margin-right: 5px;
  min-width: 20px;
`

const FlexCell = styled(RCell)`
  .rs-table-cell-content {
    display: flex;
  }
`

function PeerArticleList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('publishedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<ArticleFilter>({title: ''})
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

  useEffect(() => {
    if (peerArticleListData?.peerArticles.nodes) {
      setPeerArticles(peerArticleListData?.peerArticles.nodes)
    }
  }, [peerArticleListData?.peerArticles])

  const {t} = useTranslation()

  useEffect(() => {
    refetch(listVariables)
  }, [filter, page, limit, sortOrder, sortField, peerFilter])

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
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('peerArticles.peerArticles')}</h2>
        </ListViewHeader>

        <ListFilters
          fields={['title', 'preTitle', 'lead', 'peer', 'publicationDate']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => setFilter(filter)}
          setPeerFilter={setPeerFilter}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}
          fillHeight
          loading={isLoading}
          data={peerArticles as any[]}
          sortColumn={sortField}
          sortType={sortOrder}>
          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.title')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<PeerArticle>) => (
                <a href={rowData.peeredArticleURL} target="_blank" rel="noreferrer">
                  {rowData.article.latest.title || t('articles.overview.untitled')}
                </a>
              )}
            </RCell>
          </Column>

          <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.lead')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<PeerArticle>) =>
                rowData.article.latest.lead || t('articles.overview.untitled')
              }
            </RCell>
          </Column>

          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('peerArticles.publishedAt')}</HeaderCell>
            <RCell dataKey="publishedAt">
              {(rowData: RowDataType<PeerArticle>) =>
                rowData.article.latest.publishedAt
                  ? t('peerArticles.publicationDate', {
                      publicationDate: new Date(rowData.article.latest.publishedAt)
                    })
                  : t('peerArticles.notPublished')
              }
            </RCell>
          </Column>

          <Column width={150} align="left" resizable>
            <HeaderCell>{t('peerArticles.peer')}</HeaderCell>
            <FlexCell dataKey="peer">
              {(rowData: RowDataType<PeerArticle>) => (
                <>
                  <Avatar
                    src={rowData.peer.profile?.logo?.url || undefined}
                    alt={rowData.peer.profile?.name}
                    circle
                    size="xs"
                    className="peerArticleAvatar"
                  />
                  <div>{rowData.peer.profile?.name}</div>
                </>
              )}
            </FlexCell>
          </Column>

          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.authors')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<PeerArticle>) => {
                return (rowData as PeerArticle).article.latest.authors.reduce(
                  (allAuthors, author, index) => {
                    return `${allAuthors}${index !== 0 ? ', ' : ''}${author?.name}`
                  },
                  ''
                )
              }}
            </RCell>
          </Column>

          <Column width={120} align="left" resizable>
            <HeaderCell>{t('peerArticles.articleImage')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<PeerArticle>) =>
                rowData.article.latest.image?.url ? (
                  <Whisper
                    placement="left"
                    trigger="hover"
                    controlId="control-id-hover"
                    speaker={
                      <Popover>
                        <PopoverImg src={rowData.article.latest.image?.url || ''} alt="" />
                      </Popover>
                    }>
                    <Img src={rowData.article.latest.image?.url || ''} alt="" />
                  </Whisper>
                ) : (
                  ''
                )
              }
            </RCell>
          </Column>

          {/* This section will be uncommented when the hostURL is available. See this issue: https://wepublish.atlassian.net/browse/WPC-663}
          {/* <Column width={200} align="left" resizable>
            <HeaderCell>{t('peerArticles.originalArticle')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<PeerArticle>) => (
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
      </TableWrapper>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PEER_ARTICLES',
  'CAN_GET_PEER_ARTICLE'
])(PeerArticleList)
export {CheckedPermissionComponent as PeerArticleList}
