import { IconButtonTooltip } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdLink } from 'react-icons/md';
import { Button, Loader, Pagination } from 'rsuite';

import { CLIENTS_PER_PAGE } from './networkContent.hooks';
import {
  Card,
  CardCount,
  CardFooter,
  CardHeader,
  CenteredContainer,
  ClientCard,
  ClientName,
  ClientUserInfo,
  ConnectedBadge,
  ErrorText,
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
    .map(entry => entry.directus_users_id)
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
  onConnectClient,
}: NetworkMediaListProps) {
  const { t } = useTranslation();

  const totalPages = Math.max(1, Math.ceil(totalCount / CLIENTS_PER_PAGE));

  return (
    <Card aria-labelledby="network-media-title">
      <CardHeader>
        <h3 id="network-media-title">{t('networkContentPage.mediaTitle')}</h3>
        {!loading && !error && <CardCount>{totalCount}</CardCount>}
      </CardHeader>

      {loading && (
        <CenteredContainer>
          <Loader />
        </CenteredContainer>
      )}

      {!loading && error && (
        <CenteredContainer>
          <ErrorText>{t('networkContentPage.errorLoadingClients')}</ErrorText>
        </CenteredContainer>
      )}

      {!loading && !error && clients.length === 0 && (
        <CenteredContainer>
          {t('networkContentPage.noClients')}
        </CenteredContainer>
      )}

      {!loading &&
        !error &&
        clients.map((client: WepOneClient) => {
          const peerMatch = findPeerMatch(client.apiUrl);
          const externalUsers = getExternalUsers(client);

          return (
            <ClientCard key={client.name}>
              <div>
                <ClientName>{client.name}</ClientName>
                {externalUsers.map((user, idx) => {
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

              {peerMatch ?
                <ConnectedBadge>
                  <MdCheck />
                  {t('networkContentPage.connected')}
                </ConnectedBadge>
              : <IconButtonTooltip
                  caption={t('networkContentDashboard.noPeer')}
                >
                  <Button
                    size="xs"
                    appearance="ghost"
                    startIcon={<MdLink />}
                    onClick={() => onConnectClient?.(client)}
                  >
                    {t('networkContentPage.connectBtn')}
                  </Button>
                </IconButtonTooltip>
              }
            </ClientCard>
          );
        })}

      {!loading && !error && totalPages > 1 && (
        <CardFooter>
          <Pagination
            prev
            next
            size="sm"
            maxButtons={5}
            total={totalCount}
            limit={CLIENTS_PER_PAGE}
            activePage={page + 1}
            onChangePage={nextPage => onPageChange(nextPage - 1)}
          />
        </CardFooter>
      )}
    </Card>
  );
}
