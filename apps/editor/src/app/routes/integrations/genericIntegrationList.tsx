import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
} from '@mui/material';
import { SettingProvider } from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { DocumentNode } from 'graphql';
import { PropsWithChildren, useMemo, useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';

import {
  GenericIntegrationFormProps,
  SingleGenericIntegrationForm,
} from './genericIntegrationForm';
import { ProviderOption } from './integrationCatalog';
import { IntegrationEmptyState, ProviderChoice } from './integrationEmptyState';
import {
  AddIntegrationButton,
  CreateFixedIntegrationButton,
  DeleteIntegrationButton,
  ProviderTypeOption,
  suggestedIdFor,
  useCreateProvider,
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

  /** Providers the API looks up under a fixed id, one per type (e.g. analytics). */
  fixedProviders?: {
    createMutation: DocumentNode;
    providers: { id: string; type: string }[];
  };

  setup?: {
    createMutation: DocumentNode;
    types: ProviderTypeOption[];
  };
}

const StyledSearch = styled(TextField)`
  margin-bottom: 20px;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 20px;
`;

const GenericIntegrationGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  max-width: 960px;
`;

/** The empty state, where picking a provider adds it right away. */
function FirstProviderPicker({
  createMutation,
  refetchQuery,
  idOf,
  ...props
}: PropsWithChildren<{
  providers?: ProviderOption[];
  choices: ProviderChoice[];
  createMutation?: DocumentNode;
  refetchQuery: DocumentNode;
  idOf: (choice: ProviderChoice) => string;
}>) {
  if (!createMutation) {
    return (
      <IntegrationEmptyState
        providers={props.providers}
        children={props.children}
      />
    );
  }

  return (
    <ChoosableEmptyState
      {...props}
      createMutation={createMutation}
      refetchQuery={refetchQuery}
      idOf={idOf}
    />
  );
}

function ChoosableEmptyState({
  createMutation,
  refetchQuery,
  idOf,
  choices,
  providers,
  children,
}: PropsWithChildren<{
  providers?: ProviderOption[];
  choices: ProviderChoice[];
  createMutation: DocumentNode;
  refetchQuery: DocumentNode;
  idOf: (choice: ProviderChoice) => string;
}>) {
  const [createProvider, creating] = useCreateProvider(
    createMutation,
    refetchQuery
  );

  return (
    <IntegrationEmptyState
      providers={providers}
      choices={choices}
      disabled={creating}
      onChoose={choice =>
        createProvider({
          id: idOf(choice),
          type: choice.type,
          name: choice.label,
        })
      }
    >
      {children}
    </IntegrationEmptyState>
  );
}

export function GenericIntegrationList<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
>({
  query,
  dataKey,
  registry,
  fixedProviders,
  setup,
  ...formProps
}: GenericIntegrationListProps<TSetting, TFormValues>) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');

  const { data, loading, error } = useQuery<Record<string, unknown>>(query, {});
  const creation = registry ?? setup;
  const createMutation =
    creation?.createMutation ?? fixedProviders?.createMutation;

  const providerOf = (type: string) =>
    formProps.providers?.find(provider => provider.type === type);
  const choiceOf = (type: string, fallbackLabel = type): ProviderChoice => ({
    type,
    label: providerOf(type)?.label ?? fallbackLabel,
    logo: providerOf(type)?.logo,
  });
  const fixedIdOf = (type: string) =>
    fixedProviders?.providers.find(provider => provider.type === type)?.id;

  // What a first setup can start with: real providers only, test ones stay in the dialog.
  const firstChoices: ProviderChoice[] = (
    creation ?
      creation.types.map(option => choiceOf(option.value, option.label))
    : (fixedProviders?.providers.map(({ type }) => choiceOf(type)) ??
      [])).filter(choice => !providerOf(choice.type)?.testing);

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
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{humanizeError(error)}</Alert>;
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
      <FirstProviderPicker
        providers={formProps.providers}
        choices={firstChoices}
        createMutation={createMutation}
        refetchQuery={query}
        idOf={choice =>
          fixedIdOf(choice.type) ?? suggestedIdFor(choice.type, [])
        }
      >
        {creation && (
          <AddIntegrationButton
            types={creation.types}
            mutation={creation.createMutation}
            refetchQuery={query}
            existingIds={[]}
            label={t('integrations.empty.more')}
            variant="text"
          />
        )}
      </FirstProviderPicker>
    );
  }

  const missingFixed =
    fixedProviders?.providers.filter(
      ({ id }) => !settings.some(setting => setting.id === id)
    ) ?? [];

  return (
    <>
      {(addButton || missingFixed.length > 0) && (
        <Toolbar>
          {addButton}

          {missingFixed.map(({ id, type }) => {
            const { label } = choiceOf(type);

            return (
              <CreateFixedIntegrationButton
                key={id}
                id={id}
                type={type}
                name={label}
                mutation={fixedProviders!.createMutation}
                refetchQuery={query}
                label={t('integrations.addProvider', { provider: label })}
              />
            );
          })}
        </Toolbar>
      )}

      {settings?.length > 3 && (
        <StyledSearch
          value={searchValue}
          onChange={event => setSearchValue(event.target.value)}
          placeholder={t('search')}
          slotProps={{
            htmlInput: { 'aria-label': t('search') },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      <GenericIntegrationGrid>
        {sortedSettings?.map(setting => (
          <SingleGenericIntegrationForm
            // Remount when the setting changed, as the form only reads it once
            key={`${setting.id}:${setting.modifiedAt ?? ''}`}
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
