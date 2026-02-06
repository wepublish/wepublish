import { DocumentNode } from 'graphql';
import { useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { Input, InputGroup, Loader, Message } from 'rsuite';
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
  const [searchValue, setSearchValue] = useState('');
  const client = getApiClientV2();
  const { data, loading, error } = useQuery(query, {
    client,
  });

  const settings = data?.[dataKey] as TSetting[] | undefined;

  const sortedSettings = useMemo(() => {
    if (!settings) return undefined;

    return [...settings]
      .filter(setting => {
        const name = setting.name || setting.type || '';
        return name.toLowerCase().includes(searchValue.toLowerCase());
      })
      .sort((a, b) => {
        const nameA = a.name || a.type || '';
        const nameB = b.name || b.type || '';

        return nameA.localeCompare(nameB);
      });
  }, [settings, searchValue]);

  if (loading) return <Loader center />;
  if (error) return <Message type="error">{error.message}</Message>;

  if (!settings?.length)
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );

  return (
    <>
      {settings?.length > 3 && (
        <InputGroup style={{ marginBottom: 20 }}>
          <InputGroup.Addon>
            <MdSearch />
          </InputGroup.Addon>
          <Input
            value={searchValue}
            onChange={setSearchValue}
            placeholder={t('search') === 'search' ? 'Search...' : t('search')}
            size="lg"
          />
        </InputGroup>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
          gap: '20px',
        }}
      >
        {sortedSettings?.map(setting => (
          <SingleGenericIntegrationForm
            key={setting.id}
            setting={setting}
            {...formProps}
          />
        ))}
      </div>
    </>
  );
}
