import { useMutation } from '@apollo/client/react';
import {
  AiProviderType,
  CreateAiSettingDocument,
  SettingsIntegrationsAiDocument,
  UpdateSettingsIntegrationsAiDocument,
} from '@wepublish/editor/api';
import {
  FormDrawerPanel,
  useEditForm,
  useQueryLoader,
} from '@wepublish/form/editor';
import { CanUpdateAISettings } from '@wepublish/permissions';

import { type AiSetting, fromAiSetting } from './aiIntegration.schema';
import { aiSettingView } from './aiIntegration.view';
import vercelLogo from './assets/vercel.svg';
import { findSetting, settingName } from './integrationPaths';
import { IntegrationSettings } from './integrationSettings';
import { secretPlaceholder } from './secretPlaceholder';

const writePermissions = [CanUpdateAISettings.id];

export function AISettingForm({ setting }: { setting: AiSetting }) {
  const load = useQueryLoader(SettingsIntegrationsAiDocument, {}, data =>
    fromAiSetting(findSetting(data.aiSettings, setting.id))
  );
  const [updateSetting] = useMutation(UpdateSettingsIntegrationsAiDocument);
  const controller = useEditForm(aiSettingView, {
    title: 'integrations.editSetting',
    titleParams: () => ({ name: settingName(setting) }),
    writePermissions,
    fields: { apiKey: { placeholder: secretPlaceholder(setting.isApiKeySet) } },
    load,
    save: values => updateSetting({ variables: { id: setting.id, ...values } }),
  });

  return <FormDrawerPanel controller={controller} />;
}

export function AIIntegrationForm() {
  return (
    <IntegrationSettings<AiSetting>
      type="ai"
      query={SettingsIntegrationsAiDocument}
      dataKey="aiSettings"
      fixedProvider={{
        id: 'v0',
        type: AiProviderType.V0,
        name: 'V0',
        createMutation: CreateAiSettingDocument,
      }}
      getLogo={() => vercelLogo}
    >
      {setting => <AISettingForm setting={setting} />}
    </IntegrationSettings>
  );
}
