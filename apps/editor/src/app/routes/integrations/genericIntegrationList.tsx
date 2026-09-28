import { useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { SettingProvider } from '@wepublish/editor/api';
import { DocumentNode } from 'graphql';
import { useMemo, useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { Input, InputGroup, Loader, Message } from 'rsuite';

import {
  GenericIntegrationFormProps,
  SingleGenericIntegrationForm,
} from './genericIntegrationForm';
import {
  AddIntegrationButton,
  CreateFixedIntegrationButton,
  DeleteIntegrationButton,
  ProviderTypeOption,
} from './integrationRegistryActions';

interface GenericIntegrationListProps<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
> extends Omit<
    GenericIntegrationFormProps<TSetting, TFormValues>,
    'setting' | 'renderActions'
  > {
  query: DocumentNode;
  dataKey: string;

  registry?: {
    createMutation: DocumentNode;
    deleteMutation: DocumentNode;
    types: ProviderTypeOption[];
  };

  fixedProvider?: {
    id: string;
    type: string;
    name: string;
    createMutation: DocumentNode;
  };
}

const StyledInputGroup = styled(InputGroup)`
  margin-bottom: 20px;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const GenericIntegrationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
`;

export function GenericIntegrationList<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
>({
  query,
  dataKey,
  registry,
  fixedProvider,
  ...formProps
}: GenericIntegrationListProps<TSetting, TFormValues>) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');

  const { data, loading, error } = useQuery(query, {});

  const settings = data?.[dataKey] as TSetting[] | undefined;

  const sortedSettings = useMemo(() => {
    if (!settings) {
      return undefined;
    }

    return settings
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

  if (loading) {
    return <Loader center />;
  }

  if (error) {
    return <Message type="error">{error.message}</Message>;
  }

  const addButton = registry && (
    <AddIntegrationButton
      types={registry.types}
      mutation={registry.createMutation}
      refetchQuery={query}
      existingIds={settings?.map(setting => setting.id) ?? []}
    />
  );

  if (!settings?.length) {
    return (
      <>
        <Message type="warning">{t('integrations.noSettingsFound')}</Message>

        {(addButton || fixedProvider) && (
          <Toolbar>
            {addButton}

            {fixedProvider && (
              <CreateFixedIntegrationButton
                id={fixedProvider.id}
                type={fixedProvider.type}
                name={fixedProvider.name}
                mutation={fixedProvider.createMutation}
                refetchQuery={query}
              />
            )}
          </Toolbar>
        )}
      </>
    );
  }

  return (
    <>
      {addButton && <Toolbar>{addButton}</Toolbar>}

      {settings?.length > 3 && (
        <StyledInputGroup>
          <InputGroup.Addon>
            <MdSearch />
          </InputGroup.Addon>

          <Input
            value={searchValue}
            onChange={setSearchValue}
            placeholder={t('search')}
            size="lg"
          />
        </StyledInputGroup>
      )}

      <GenericIntegrationGrid>
        {sortedSettings?.map(setting => (
          <SingleGenericIntegrationForm
            key={setting.id}
            setting={setting}
            renderActions={
              registry ?
                current => (
                  <DeleteIntegrationButton
                    id={current.id}
                    mutation={registry.deleteMutation}
                    refetchQuery={query}
                  />
                )
              : undefined
            }
            {...formProps}
          />
        ))}
      </GenericIntegrationGrid>
    </>
  );
}
