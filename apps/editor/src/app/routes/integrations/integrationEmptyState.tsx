import styled from '@emotion/styled';
import { Card, CardContent, Chip, Typography } from '@mui/material';
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
  align-items: center;
  gap: 16px 24px;
`;

export const EmptyStateLogo = styled.img`
  height: 28px;
  max-width: 120px;
  object-fit: contain;
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
          {t('integrations.empty.description')}
        </Typography>

        {providers.length > 0 && (
          <EmptyStateProviders>
            {providers.map(provider =>
              provider.logo ?
                <EmptyStateLogo
                  key={provider.type}
                  src={provider.logo}
                  alt={provider.label}
                  title={provider.label}
                />
              : <Chip
                  key={provider.type}
                  variant="outlined"
                  label={provider.label}
                />
            )}
          </EmptyStateProviders>
        )}

        <EmptyStateActions>{children}</EmptyStateActions>
      </EmptyStateContent>
    </Card>
  );
}
