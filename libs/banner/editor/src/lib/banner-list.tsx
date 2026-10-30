import { useQuery } from '@apollo/client/react';
import { BannersDocument, FullBannerFragment } from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DataTable,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { BannerDeleteModal } from './banner-delete-modal';
import { Button } from '@mui/material';
import {
  CanCreateBanner,
  CanDeleteBanner,
  CanGetBanner,
  CanGetBanners,
} from '@wepublish/permissions';

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
          <PageTitle>{t('banner.list.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            loading={loading}
            startIcon={<MdAdd />}
          >
            {t('banner.list.createNew')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="banners"
          data={data?.banners || []}
          loading={loading}
          columns={[
            {
              id: 'title',
              alwaysVisible: true,
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
  CanGetBanners.id,
  CanGetBanner.id,
  CanCreateBanner.id,
  CanDeleteBanner.id,
])(BannerList);
export { CheckedPermissionComponent as BannerList };
