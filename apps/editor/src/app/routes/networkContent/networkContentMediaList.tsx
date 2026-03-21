import { Chip, CircularProgress, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft, MdChevronRight, MdLink } from 'react-icons/md';

import { CLIENTS_PER_PAGE } from './networkContent.hooks';
import {
  CenteredContainer,
  ClientCard,
  ClientName,
  ClientUserInfo,
  PaginationBar,
  SectionTitle,
} from './networkContent.styles';
import type {
  PeerMatch,
  WepOneClient,
  WepOneUser,
} from './networkContent.types';

function isInternalUser(user: WepOneUser): boolean {
  return !!user?.email && user?.email.endsWith('@wepublish.ch');
}

function getExternalUsers(client: WepOneClient): WepOneUser[] {
  return (client.allowedUsers ?? [])
    .map(entry => entry.wep_one_users_id)
    .filter(user => !isInternalUser(user));
}

interface NetworkMediaListProps {
  clients: WepOneClient[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  page: number;
  onPageChange: (page: number) => void;
  findPeerMatch: (apiUrl: string | null) => PeerMatch | null;
  onSelectClient?: (clientName: string) => void;
  onConnectClient?: (client: WepOneClient) => void;
}

export function NetworkMediaList({
  clients,
  totalCount,
  loading,
  error,
  page,
  onPageChange,
  findPeerMatch,
  onSelectClient,
  onConnectClient,
}: NetworkMediaListProps) {
  const { t } = useTranslation();

  const totalPages = Math.max(1, Math.ceil(totalCount / CLIENTS_PER_PAGE));

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

      {clients.map((client: WepOneClient) => {
        const peerMatch = findPeerMatch(client.apiUrl);
        const externalUsers = getExternalUsers(client);

        return (
          <ClientCard key={client.name}>
            <div>
              <ClientName>{client.name}</ClientName>
              {externalUsers.length > 0 &&
                externalUsers.map((user, idx) => {
                  const name = [user?.first_name, user?.last_name]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <ClientUserInfo key={idx}>
                      {name}
                      {name && user?.email ? ' · ' : ''}
                      {user?.email}
                    </ClientUserInfo>
                  );
                })}
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {peerMatch ?
                <Chip
                  icon={<MdLink />}
                  label={t('networkContentPage.connected')}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              : <Chip
                  label={t('networkContentPage.connectBtn')}
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={() => onConnectClient?.(client)}
                  clickable
                />
              }

              {onSelectClient && (
                <Chip
                  label={t('networkContentPage.filterByMedia')}
                  size="small"
                  variant="outlined"
                  onClick={() => onSelectClient(client.name)}
                  clickable
                />
              )}
            </div>
          </ClientCard>
        );
      })}

      {totalPages > 1 && (
        <PaginationBar>
          <IconButton
            size="small"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <MdChevronLeft />
          </IconButton>
          <Typography variant="body2">
            {page + 1} / {totalPages}
          </Typography>
          <IconButton
            size="small"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            <MdChevronRight />
          </IconButton>
        </PaginationBar>
      )}
    </div>
  );
}
