import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  PaywallListDocument,
  SettingName,
  SettingsListDocument,
  UpdateSettingDocument,
} from '@wepublish/editor/api';
import {
  FormPage,
  setFieldError,
  useQueryLoader,
  useSingletonForm,
} from '@wepublish/form/editor';
import { CanGetSettings, CanUpdateSettings } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { fromSettings } from './settings.schema';
import { settingsView } from './settings.view';

const accessPermissions = [CanGetSettings.id, CanUpdateSettings.id];
const updatePermissions = [CanUpdateSettings.id];

const isInvalidSetting = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some(({ message }) => message === 'Invalid Setting Data');

export function SettingsForm() {
  const { t } = useTranslation();
  const load = useQueryLoader(SettingsListDocument, {}, fromSettings);
  const [updateSetting] = useMutation(UpdateSettingDocument);
  const { data: paywallData } = useQuery(PaywallListDocument);

  const paywallName = (id: string | null | undefined) => {
    if (id === null || id === undefined || id === '') {
      return t('form.value.empty');
    }

    const paywall = paywallData?.paywalls.find(({ id: other }) => other === id);

    return paywall?.name || id;
  };

  const settings = useSingletonForm(settingsView, {
    title: 'settingList.settings',
    writePermissions: updatePermissions,
    confirm: {
      title: 'settingList.confirmTitle',
      description: 'settingList.warnings.askOperators',
      format: { [SettingName.NewArticlePaywall]: paywallName },
    },
    load,
    save: async (values, { changedKeys, form }) => {
      const results = await Promise.allSettled(
        changedKeys.map(name =>
          updateSetting({ variables: { name, value: values[name] ?? null } })
        )
      );
      const saved = changedKeys.filter(
        (_, index) => results[index].status === 'fulfilled'
      );

      form.resetDefaultValues({
        ...form.formState.defaultValues,
        ...Object.fromEntries(saved.map(name => [name, values[name]])),
      });

      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          if (!isInvalidSetting(result.reason)) {
            throw result.reason;
          }

          setFieldError(form, changedKeys[index], 'settingList.errors.invalid');
        }
      }
    },
  });

  return <FormPage controller={settings} />;
}

export function SettingList() {
  return (
    <PermissionControl
      qualifyingPermissions={accessPermissions}
      showRejectionMessage
    >
      <SettingsForm />
    </PermissionControl>
  );
}
