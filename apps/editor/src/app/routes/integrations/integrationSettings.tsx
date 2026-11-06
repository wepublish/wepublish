import { Alert } from '@mui/material';
import { SettingProvider } from '@wepublish/editor/api';
import { FormDrawer, useRouteDrawer } from '@wepublish/form/editor';
import { Fragment, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  integrationPaths,
  integrationRoutes,
  IntegrationType,
  settingName,
} from './integrationPaths';
import { IntegrationSettingCard } from './integrationSettingCard';
import {
  IntegrationSettingList,
  IntegrationSettingListProps,
} from './integrationSettingList';

type IntegrationSettingsProps<
  TSetting extends SettingProvider & { type?: string },
> = Omit<
  IntegrationSettingListProps<TSetting>,
  'renderSetting' | 'children'
> & {
  type: IntegrationType;
  getLogo?: (setting: TSetting) => string | undefined;
  children: (setting: TSetting) => ReactNode;
};

export function IntegrationSettings<
  TSetting extends SettingProvider & { type?: string },
>({
  type,
  getLogo,
  children,
  ...list
}: IntegrationSettingsProps<TSetting>) {
  const { t } = useTranslation();
  const drawer = useRouteDrawer(integrationRoutes(type));
  const paths = integrationPaths(type);

  return (
    <IntegrationSettingList<TSetting>
      {...list}
      renderSetting={(setting, actions) => (
        <IntegrationSettingCard
          name={settingName(setting)}
          type={setting.type}
          logo={getLogo?.(setting)}
          lastLoadedAt={setting.lastLoadedAt}
          editPath={paths.edit(setting.id)}
          actions={actions}
        />
      )}
    >
      {settings => {
        const setting = settings.find(({ id }) => id === drawer.id);

        return (
          <FormDrawer
            open={drawer.open}
            onClose={drawer.close}
            width="md"
          >
            {setting !== undefined ?
              <Fragment key={setting.id}>{children(setting)}</Fragment>
            : settings.length > 0 ?
              <Alert
                severity="warning"
                sx={{ m: 2 }}
              >
                {t('integrations.notFound')}
              </Alert>
            : null}
          </FormDrawer>
        );
      }}
    </IntegrationSettingList>
  );
}
