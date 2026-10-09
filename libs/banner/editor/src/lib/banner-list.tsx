import { useQuery } from '@apollo/client/react';
import { BannersDocument, FullBannerFragment } from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  DataTable,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { BannerDeleteModal } from './banner-delete-modal';
import React from 'react';
import { Button } from '@mui/material';

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
            <Button
              variant="contained"
              loading={loading}
              startIcon={<MdAdd />}
            >
              {t('banner.list.createNew')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={data?.banners || []}
          loading={loading}
          columns={[
            {
              id: 'title',
              label: t('banner.list.title'),
              width: 300,
              render: rowData => (
                <Link to={`/banners/edit/${rowData.id}`}>{rowData.title}</Link>
              ),
            },
            {
              id: 'text',
              label: t('banner.list.text'),
              width: 300,
              render: rowData => (rowData as FullBannerFragment).text,
            },
            {
              id: 'active',
              label: t('banner.list.active'),
              width: 100,
              render: rowData =>
                (rowData as FullBannerFragment).active ? '✓' : '⨯',
            },
            {
              id: 'showforloginstatus',
              label: t('banner.form.showForLoginStatus'),
              width: 200,
              render: rowData =>
                t(
                  `banner.form.loginStatus.${(rowData as FullBannerFragment).showForLoginStatus}`
                ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: banner => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() =>
                      setBannerDelete(banner as FullBannerFragment)
                    }
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />

        {/*<Pagination
          state={{
            page: page,
            limit: limit,
            setPage: setPage,
            setLimit: setLimit,
          }}
          totalCount={data?.banners?.totalCount ?? 0}
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
