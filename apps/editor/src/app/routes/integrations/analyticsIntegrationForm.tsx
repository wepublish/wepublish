import { useMutation } from '@apollo/client/react';
import {
  AnalyticsProviderType,
  CreateAnalyticsProviderSettingDocument,
  SettingsIntegrationsAnalyticsDocument,
  UpdateAnalyticsProviderSettingDocument,
} from '@wepublish/editor/api';
import {
  bindComponent,
  FormDrawerPanel,
  useEditForm,
  useQueryLoader,
} from '@wepublish/form/editor';
import { CanUpdateAnalyticsProviderSettings } from '@wepublish/permissions';

import {
  type AnalyticsSetting,
  fromAnalyticsSetting,
} from './analyticsIntegration.schema';
import { analyticsSettingView } from './analyticsIntegration.view';
import googleLogo from './assets/google.svg';
import { CredentialsDropzoneField } from './credentialsDropzone';
import { findSetting, settingName } from './integrationPaths';
import { IntegrationSettings } from './integrationSettings';

const writePermissions = [CanUpdateAnalyticsProviderSettings.id];

export function AnalyticsSettingForm({
  setting,
}: {
  setting: AnalyticsSetting;
}) {
  const load = useQueryLoader(
    SettingsIntegrationsAnalyticsDocument,
    {},
    data =>
      fromAnalyticsSetting(
        findSetting(data.analyticsProviderSettings, setting.id)
      )
  );
  const [updateSetting] = useMutation(UpdateAnalyticsProviderSettingDocument);
  const controller = useEditForm(analyticsSettingView, {
    title: 'integrations.editSetting',
    titleParams: () => ({ name: settingName(setting) }),
    writePermissions,
    fields: {
      credentials: {
        component: bindComponent(CredentialsDropzoneField, {
          stored: setting.isCredentialsSet,
        }),
      },
    },
    load,
    save: values => updateSetting({ variables: { id: setting.id, ...values } }),
  });

  return <FormDrawerPanel controller={controller} />;
}

export function AnalyticsIntegrationForm() {
  return (
    <IntegrationSettings<AnalyticsSetting>
      type="analytics"
      query={SettingsIntegrationsAnalyticsDocument}
      dataKey="analyticsProviderSettings"
      fixedProvider={{
        id: 'google-analytics',
        type: AnalyticsProviderType.Google,
        name: 'Google Analytics',
        createMutation: CreateAnalyticsProviderSettingDocument,
      }}
      getLogo={() => googleLogo}
    >
      {setting => <AnalyticsSettingForm setting={setting} />}
    </IntegrationSettings>
  );
}
