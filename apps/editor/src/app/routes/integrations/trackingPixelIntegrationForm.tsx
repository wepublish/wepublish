import { useMutation } from '@apollo/client/react';
import {
  CreateTrackingPixelSettingDocument,
  DeleteTrackingPixelSettingDocument,
  TrackingPixelProviderType,
  TrackingPixelSettingsDocument,
  UpdateTrackingPixelSettingDocument,
} from '@wepublish/editor/api';
import {
  FormDrawerPanel,
  useEditForm,
  useQueryLoader,
} from '@wepublish/form/editor';
import { CanUpdateTrackingPixelSettings } from '@wepublish/permissions';

import proLitterisLogo from './assets/proLitteris.svg';
import { findSetting, settingName } from './integrationPaths';
import { IntegrationSettings } from './integrationSettings';
import { secretPlaceholder } from './secretPlaceholder';
import {
  type TrackingPixelSetting,
  fromTrackingPixelSetting,
  toTrackingPixelSettingVariables,
} from './trackingPixelIntegration.schema';
import { trackingPixelSettingView } from './trackingPixelIntegration.view';

const writePermissions = [CanUpdateTrackingPixelSettings.id];

const trackingPixelTypes = Object.values(TrackingPixelProviderType).map(
  value => ({ label: value, value })
);

const trackingPixelLogo = (setting: TrackingPixelSetting) =>
  setting.type === TrackingPixelProviderType.Prolitteris ?
    proLitterisLogo
  : undefined;

export function TrackingPixelSettingForm({
  setting,
}: {
  setting: TrackingPixelSetting;
}) {
  const load = useQueryLoader(TrackingPixelSettingsDocument, {}, data =>
    fromTrackingPixelSetting(
      findSetting(data.trackingPixelSettings, setting.id)
    )
  );
  const [updateSetting] = useMutation(UpdateTrackingPixelSettingDocument);
  const controller = useEditForm(trackingPixelSettingView, {
    title: 'integrations.editSetting',
    titleParams: () => ({ name: settingName(setting) }),
    writePermissions,
    fields: {
      prolitteris_password: {
        placeholder: secretPlaceholder(setting.prolitteris_isPasswordSet),
      },
    },
    load,
    save: values =>
      updateSetting({
        variables: toTrackingPixelSettingVariables(setting.id, values),
      }),
  });

  return <FormDrawerPanel controller={controller} />;
}

export function TrackingPixelIntegrationForm() {
  return (
    <IntegrationSettings<TrackingPixelSetting>
      type="tracking-pixel"
      query={TrackingPixelSettingsDocument}
      dataKey="trackingPixelSettings"
      registry={{
        createMutation: CreateTrackingPixelSettingDocument,
        deleteMutation: DeleteTrackingPixelSettingDocument,
        types: trackingPixelTypes,
      }}
      getLogo={trackingPixelLogo}
    >
      {setting => <TrackingPixelSettingForm setting={setting} />}
    </IntegrationSettings>
  );
}
