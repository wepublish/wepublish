import {
  Banner,
  getApiClientV2,
  useBannersQuery,
  useCreateBannerMutation
} from '@wepublish/editor/api-v2'
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DeletePollModal,
  IconButton,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Pagination,
  PollClosedAtView,
  PollOpensAtView,
  PollStateIndication,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete, MdEdit} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Button, Table as RTable} from 'rsuite'
import {RowDataType} from 'rsuite/esm/Table'

const {Column, HeaderCell, Cell: RCell} = RTable

function BannerList() {
  const {t} = useTranslation()
  const [bannerDelete, setBannerDelete] = useState<Banner | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  const client = useMemo(() => getApiClientV2(), [])

  const {data, loading, error, refetch} = useBannersQuery({
    client,
    variables: {
      take: limit,
      skip: (page - 1) * limit
    },
    onError: () => {}
  })

  async function createBanner() {
    await createBannerMutation({
      onError: () => {}
    })
  }

  const [createBannerMutation, {data: newBanner}] = useCreateBannerMutation()

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('bannerList.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton appearance="primary" loading={loading}>
              <MdAdd />
              {t('bannerList.createNew')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table fillHeight loading={loading} data={data?.banners || []}>
          {/* state */}
          <Column width={200} resizable>
            <HeaderCell>{t('bannerList.title')}</HeaderCell>
            <RCell>{(rowData: RowDataType<Banner>) => (rowData as Banner).title}</RCell>
          </Column>
          {/* question */}
          <Column width={200} resizable>
            <HeaderCell>{t('bannerList.active')}</HeaderCell>
            <RCell>{(rowData: RowDataType<Banner>) => (rowData as Banner).active.toString()}</RCell>
          </Column>
          <Column resizable fixed="right">
            <HeaderCell align={'center'}>{t('bannerList.edit')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(banner: RowDataType<Banner>) => (
                <Link to={`edit/${(banner as Banner).id}`}>
                  <IconButton icon={<MdEdit />} circle size="sm" />
                </Link>
              )}
            </PaddedCell>
          </Column>
          <Column resizable fixed="right">
            <HeaderCell align={'center'}>{t('bannerList.delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(banner: RowDataType<Banner>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setBannerDelete(banner as Banner)}
                />
              )}
            </PaddedCell>
          </Column>
        </Table>

        {/*<Pagination
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
          total={data?.banners?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />*/}
      </TableWrapper>

      {/*<DeleteBannerModal
        poll={bannerDelete}
        onDelete={refetch}
        onClose={() => setBannerDelete(undefined)}
      />*/}
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_BANNERS',
  'CAN_GET_BANNER',
  'CAN_CREATE_BANNER',
  'CAN_DELETE_BANNER'
])(BannerList)
export {CheckedPermissionComponent as BannerList}
