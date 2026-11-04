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
import { Fragment, ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';

import {
  AddIntegrationButton,
  CreateFixedIntegrationButton,
  DeleteIntegrationButton,
  ProviderTypeOption,
} from './integrationRegistryActions';

export type IntegrationRegistry = {
  createMutation: DocumentNode;
  deleteMutation: DocumentNode;
  types: ProviderTypeOption[];
};

export type FixedIntegrationProvider = {
  id: string;
  type: string;
  name: string;
  createMutation: DocumentNode;
};

export type IntegrationSetup = {
  createMutation: DocumentNode;
  types: ProviderTypeOption[];
};

export interface IntegrationSettingListProps<
  TSetting extends SettingProvider & { type?: string },
> {
  query: DocumentNode;
  dataKey: string;
  registry?: IntegrationRegistry;
  fixedProvider?: FixedIntegrationProvider;
  setup?: IntegrationSetup;
  renderSetting: (setting: TSetting, actions: ReactNode) => ReactNode;
  children?: (settings: TSetting[]) => ReactNode;
}

const StyledSearch = styled(TextField)`
  margin-bottom: 20px;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const IntegrationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(450px, 100%), 1fr));
  gap: 20px;
`;

export function IntegrationSettingList<
  TSetting extends SettingProvider & { type?: string },
>({
  query,
  dataKey,
  registry,
  fixedProvider,
  setup,
  renderSetting,
  children,
}: IntegrationSettingListProps<TSetting>) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');

  const { data, loading, error } = useQuery<Record<string, unknown>>(query, {});

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

  const drawer = children?.(settings ?? []);

  if (loading) {
    return (
      <>
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
        {drawer}
      </>
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
      <>
        <Alert severity="warning">
          {setup ?
            t('integrations.setUpHint')
          : t('integrations.noSettingsFound')}
        </Alert>

        {(addButton || fixedProvider || setup) && (
          <Toolbar>
            {addButton}

            {setup && (
              <AddIntegrationButton
                types={setup.types}
                mutation={setup.createMutation}
                refetchQuery={query}
                existingIds={[]}
                label={t('integrations.setUp')}
              />
            )}

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

        {drawer}
      </>
    );
  }

  return (
    <>
      {addButton && <Toolbar>{addButton}</Toolbar>}

      {settings.length > 3 && (
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

      <IntegrationGrid>
        {sortedSettings?.map(setting => (
          <Fragment key={setting.id}>
            {renderSetting(
              setting,
              registry ?
                <DeleteIntegrationButton
                  id={setting.id}
                  mutation={registry.deleteMutation}
                  refetchQuery={query}
                />
              : null
            )}
          </Fragment>
        ))}
      </IntegrationGrid>

      {drawer}
    </>
  );
}
