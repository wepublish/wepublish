import { useQuery } from '@apollo/client/react';
import { BannersDocument, FullBannerFragment } from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  IconButton,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';
import { BannerDeleteModal } from './banner-delete-modal';
import React from 'react';

const { Column, HeaderCell, Cell: RCell } = RTable;

function BannerList() {
  const { t } = useTranslation();
  const [bannerDelete, setBannerDelete] = useState<
    FullBannerFragment | undefined
  >(undefined);

  const { data, loading, error, refetch } = useQuery(BannersDocument, {
    variables: {
      take: 100,
      skip: 0,
    },
  });

  useEffect(() => {
    if (error) {
      console.log(error);
    }
  }, [error]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('banner.list.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton
              appearance="primary"
              loading={loading}
            >
              <MdAdd />
              {t('banner.list.createNew')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.banners || []}
        >
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('banner.list.title')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullBannerFragment>) => (
                <Link to={`/banners/edit/${rowData.id}`}>{rowData.title}</Link>
              )}
            </RCell>
          </Column>
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('banner.list.text')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullBannerFragment>) =>
                (rowData as FullBannerFragment).text
              }
            </RCell>
          </Column>
          <Column
            width={100}
            resizable
          >
            <HeaderCell>{t('banner.list.active')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullBannerFragment>) =>
                (rowData as FullBannerFragment).active ? '✓' : '⨯'
              }
            </RCell>
          </Column>
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('banner.form.showForLoginStatus')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullBannerFragment>) =>
                t(
                  `banner.form.loginStatus.${(rowData as FullBannerFragment).showForLoginStatus}`
                )
              }
            </RCell>
          </Column>
          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('banner.list.delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(banner: RowDataType<FullBannerFragment>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setBannerDelete(banner as FullBannerFragment)}
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

      {
        <BannerDeleteModal
          banner={bannerDelete}
          onDelete={refetch}
          onClose={() => setBannerDelete(undefined)}
        />
      }
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_BANNERS',
  'CAN_GET_BANNER',
  'CAN_CREATE_BANNER',
  'CAN_DELETE_BANNER',
])(BannerList);
export { CheckedPermissionComponent as BannerList };
