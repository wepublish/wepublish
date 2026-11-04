import { SettingProvider } from '@wepublish/editor/api';
import { FieldValues } from 'react-hook-form';

import {
  GenericIntegrationFormProps,
  SingleGenericIntegrationForm,
} from './genericIntegrationForm';
import {
  IntegrationSettingList,
  IntegrationSettingListProps,
} from './integrationSettingList';

type GenericIntegrationListProps<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
> = Omit<
  GenericIntegrationFormProps<TSetting, TFormValues>,
  'setting' | 'renderActions'
> &
  Omit<IntegrationSettingListProps<TSetting>, 'renderSetting' | 'children'>;

export function GenericIntegrationList<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
>({
  query,
  dataKey,
  registry,
  fixedProvider,
  setup,
  ...formProps
}: GenericIntegrationListProps<TSetting, TFormValues>) {
  return (
    <IntegrationSettingList<TSetting>
      query={query}
      dataKey={dataKey}
      registry={registry}
      fixedProvider={fixedProvider}
      setup={setup}
      renderSetting={(setting, actions) => (
        <SingleGenericIntegrationForm
          setting={setting}
          renderActions={actions ? () => actions : undefined}
          {...formProps}
        />
      )}
    />
  );
}
