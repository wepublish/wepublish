import { GateMode } from '@wepublish/editor/api';
import { GateList } from '@wepublish/gate/editor';
import {
  CanCreateBanner,
  CanDeleteBanner,
  CanGetBanner,
  CanGetBanners,
} from '@wepublish/permissions';
import { createCheckedPermissionComponent, Link } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

function BannerList() {
  const { t } = useTranslation();

  return (
    <GateList
      mode={GateMode.Banner}
      storageKey="banners"
      title={t('banner.list.title')}
      createLabel={t('banner.list.createNew')}
      columns={[
        {
          id: 'title',
          alwaysVisible: true,
          label: t('banner.list.title'),
          width: 300,
          render: banner => (
            <Link to={`/banners/edit/${banner.id}`}>{banner.title}</Link>
          ),
        },
        {
          id: 'text',
          label: t('banner.list.text'),
          width: 300,
          render: banner => banner.text,
        },
        {
          id: 'active',
          label: t('banner.list.active'),
          width: 100,
          render: banner => (banner.active ? '✓' : '⨯'),
        },
        {
          id: 'showforloginstatus',
          label: t('banner.form.showForLoginStatus'),
          width: 200,
          render: banner => t(`banner.form.loginStatus.${banner.audience}`),
        },
      ]}
      deleteTexts={banner => ({
        title: t('banner.delete.title'),
        body: t('banner.delete.body', { name: banner.title }),
        confirm: t('banner.delete.delete'),
      })}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetBanners.id,
  CanGetBanner.id,
  CanCreateBanner.id,
  CanDeleteBanner.id,
])(BannerList);
export { CheckedPermissionComponent as BannerList };
