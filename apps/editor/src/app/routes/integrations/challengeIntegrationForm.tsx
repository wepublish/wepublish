import { useMutation } from '@apollo/client/react';
import {
  ChallengeProviderType,
  CreateSettingsIntegrationsChallengeDocument,
  SettingsIntegrationsChallengeDocument,
  UpdateSettingsIntegrationsChallengeDocument,
} from '@wepublish/editor/api';
import {
  cancelSave,
  FormDrawerPanel,
  useEditForm,
  useQueryLoader,
} from '@wepublish/form/editor';
import { CanUpdateChallengeProviderSettings } from '@wepublish/permissions';

import cloudflareLogo from './assets/cloudflare.svg';
import hcaptchaLogo from './assets/hcaptcha.webp';
import {
  type ChallengeSetting,
  fromChallengeSetting,
} from './challengeIntegration.schema';
import { challengeSettingView } from './challengeIntegration.view';
import { findSetting, settingName } from './integrationPaths';
import { IntegrationSettings } from './integrationSettings';
import { secretPlaceholder } from './secretPlaceholder';
import { useTypeChangeQuestion } from './typeChangeDialog';

const writePermissions = [CanUpdateChallengeProviderSettings.id];

const challengeTypes = Object.values(ChallengeProviderType).map(type => ({
  label: type,
  value: type,
}));

const challengeLogo = (setting: ChallengeSetting) =>
  setting.type === ChallengeProviderType.Hcaptcha ?
    hcaptchaLogo
  : cloudflareLogo;

export function ChallengeSettingForm({
  setting,
}: {
  setting: ChallengeSetting;
}) {
  const [askTypeChange, typeChangeDialog] = useTypeChangeQuestion();
  const load = useQueryLoader(
    SettingsIntegrationsChallengeDocument,
    {},
    data =>
      fromChallengeSetting(
        findSetting(data.challengeProviderSettings, setting.id)
      )
  );
  const [updateSetting] = useMutation(
    UpdateSettingsIntegrationsChallengeDocument
  );
  const controller = useEditForm(challengeSettingView, {
    title: 'integrations.editSetting',
    titleParams: () => ({ name: settingName(setting) }),
    writePermissions,
    fields: { secret: { placeholder: secretPlaceholder(setting.isSecretSet) } },
    load,
    save: async (values, { changedKeys }) => {
      if (changedKeys.includes('type') && !(await askTypeChange())) {
        cancelSave();
      }

      return updateSetting({ variables: { id: setting.id, ...values } });
    },
  });

  return (
    <>
      <FormDrawerPanel controller={controller} />
      {typeChangeDialog}
    </>
  );
}

export function ChallengeIntegrationForm() {
  return (
    <IntegrationSettings<ChallengeSetting>
      type="challenge"
      query={SettingsIntegrationsChallengeDocument}
      dataKey="challengeProviderSettings"
      setup={{
        createMutation: CreateSettingsIntegrationsChallengeDocument,
        types: challengeTypes,
      }}
      getLogo={challengeLogo}
    >
      {setting => <ChallengeSettingForm setting={setting} />}
    </IntegrationSettings>
  );
}
