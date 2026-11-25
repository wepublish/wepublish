import styled from '@emotion/styled';
import { ButtonBase, Card, CardContent, Typography } from '@mui/material';
import { DocumentNode } from 'graphql';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { ProviderOption } from './integrationCatalog';
import { useCreateProvider } from './integrationRegistryActions';

export const EmptyStateContent = styled(CardContent)`
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 16px;
  padding: 40px 24px;
`;

export const EmptyStateProviders = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 16px 24px;
`;

export const EmptyStateLogo = styled.img`
  height: 28px;
  max-width: 120px;
  object-fit: contain;
`;

export const EmptyStateProvider = styled.div`
  display: grid;
  grid-template-rows: 28px auto;
  justify-items: center;
  align-items: center;
  gap: 8px;
  width: 140px;
`;

/** A provider to start with: picking it adds it right away. */
const choiceSx = {
  display: 'grid',
  gridTemplateRows: '28px auto',
  justifyItems: 'center',
  alignContent: 'start',
  gap: 1,
  width: 140,
  py: 2,
  px: 1,
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  transition: 'border-color 150ms, background-color 150ms',
  '&:hover, &.Mui-focusVisible': {
    borderColor: 'primary.main',
    bgcolor: 'action.hover',
  },
} as const;

export type ProviderChoice = {
  type: string;
  label: string;
  logo?: string;
};

export const EmptyStateActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

/** What an integration looks like before anything is set up: what to choose from, and how to start. */
export function IntegrationEmptyState({
  providers = [],
  choices,
  onChoose,
  disabled,
  children,
}: PropsWithChildren<{
  providers?: ProviderOption[];
  /** Providers that can be added from here; without them the providers are only listed. */
  choices?: ProviderChoice[];
  onChoose?: (choice: ProviderChoice) => void;
  disabled?: boolean;
}>) {
  const { t } = useTranslation();
  const offered =
    choices?.length ? choices : providers.filter(provider => !provider.testing);
  const choosable = !!choices?.length && !!onChoose;

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 1 }}
    >
      <EmptyStateContent>
        <Typography
          variant="h5"
          component="h2"
        >
          {t('integrations.empty.title')}
        </Typography>

        <Typography sx={{ color: 'text.secondary', maxWidth: '60ch' }}>
          {offered.length > 1 ?
            t('integrations.empty.description')
          : t('integrations.empty.descriptionSingle')}
        </Typography>

        {offered.length > 0 && (
          <EmptyStateProviders>
            {offered.map(provider => {
              const content = (
                <>
                  {provider.logo ?
                    <EmptyStateLogo
                      src={provider.logo}
                      alt=""
                    />
                  : <span />}
                  <Typography variant="body2">{provider.label}</Typography>
                </>
              );

              return choosable ?
                  <ButtonBase
                    key={provider.type}
                    sx={choiceSx}
                    disabled={disabled}
                    onClick={() => onChoose(provider)}
                  >
                    {content}
                  </ButtonBase>
                : <EmptyStateProvider key={provider.type}>
                    {content}
                  </EmptyStateProvider>;
            })}
          </EmptyStateProviders>
        )}

        <EmptyStateActions>{children}</EmptyStateActions>
      </EmptyStateContent>
    </Card>
  );
}

/** The empty state, where picking a provider adds it right away. */
export function FirstProviderPicker({
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
