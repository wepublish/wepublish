import { Chip, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { DirectusClient } from './networkContent.types';
import { useNetworkClients } from './networkContent.hooks';
import {
  CenteredContainer,
  ClientCard,
  ClientName,
  ClientUrl,
  SectionTitle,
} from './networkContent.styles';

interface NetworkMediaListProps {
  onSelectClient?: (clientName: string) => void;
}

export function NetworkMediaList({ onSelectClient }: NetworkMediaListProps) {
  const { t } = useTranslation();
  const { clients, loading, error } = useNetworkClients();

  if (loading) {
    return (
      <CenteredContainer>
        <CircularProgress size={20} />
      </CenteredContainer>
    );
  }

  if (error) {
    return (
      <CenteredContainer>
        <Typography
          color="error"
          variant="body2"
        >
          {t('networkContentPage.errorLoadingClients')}
        </Typography>
      </CenteredContainer>
    );
  }

  if (clients.length === 0) {
    return (
      <CenteredContainer>
        <Typography
          color="textSecondary"
          variant="body2"
        >
          {t('networkContentPage.noClients')}
        </Typography>
      </CenteredContainer>
    );
  }

  return (
    <div>
      <SectionTitle>{t('networkContentPage.mediaTitle')}</SectionTitle>

      {clients.map((client: DirectusClient) => (
        <ClientCard key={client.name}>
          <div>
            <ClientName>{client.name}</ClientName>
            {client.apiUrl && <ClientUrl>{client.apiUrl.trim()}</ClientUrl>}
          </div>

          {onSelectClient && (
            <Chip
              label={t('networkContentPage.filterByMedia')}
              size="small"
              variant="outlined"
              onClick={() => onSelectClient(client.name)}
              clickable
            />
          )}
        </ClientCard>
      ))}
    </div>
  );
}
