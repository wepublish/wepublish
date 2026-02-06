import { DocumentNode } from 'graphql';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Loader, Message } from 'rsuite';
import { getApiClientV2 } from '@wepublish/editor/api-v2';
import {
  GenericIntegrationFormProps,
  SingleGenericIntegrationForm,
} from './genericIntegrationForm';
import { FieldValues } from 'react-hook-form';

interface GenericIntegrationListProps<
  TSetting extends { id: string; name?: string | null; type?: string },
  TFormValues extends FieldValues,
> extends Omit<GenericIntegrationFormProps<TSetting, TFormValues>, 'setting'> {
  query: DocumentNode;
  dataKey: string;
}

export function GenericIntegrationList<
  TSetting extends { id: string; name?: string | null; type?: string },
  TFormValues extends FieldValues,
>({
  query,
  dataKey,
  ...formProps
}: GenericIntegrationListProps<TSetting, TFormValues>) {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const { data, loading, error } = useQuery(query, {
    client,
  });

  if (loading) return <Loader center />;
  if (error) return <Message type="error">{error.message}</Message>;

  const settings = data?.[dataKey] as TSetting[] | undefined;

  if (!settings?.length)
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );

  return (
    <div>
      {settings.map(setting => (
        <SingleGenericIntegrationForm
          key={setting.id}
          setting={setting}
          {...formProps}
        />
      ))}
    </div>
  );
}
