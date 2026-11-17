import styled from '@emotion/styled';
import { Card, CardContent, Typography } from '@mui/material';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { ProviderOption } from './integrationCatalog';

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
  align-items: start;
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

export const EmptyStateActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

/** What an integration looks like before anything is set up: what to choose from, and how to start. */
export function IntegrationEmptyState({
  providers = [],
  children,
}: PropsWithChildren<{ providers?: ProviderOption[] }>) {
  const { t } = useTranslation();
  const offered = providers.filter(provider => !provider.testing);

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
            {offered.map(provider => (
              <EmptyStateProvider key={provider.type}>
                {provider.logo ?
                  <EmptyStateLogo
                    src={provider.logo}
                    alt=""
                  />
                : <span />}
                <Typography variant="body2">{provider.label}</Typography>
              </EmptyStateProvider>
            ))}
          </EmptyStateProviders>
        )}

        <EmptyStateActions>{children}</EmptyStateActions>
      </EmptyStateContent>
    </Card>
  );
}
