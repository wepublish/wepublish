import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Card,
  CardActionArea,
  Chip,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  AuthContext,
  fuzzySearch,
  PageTitle,
  useFeatures,
} from '@wepublish/ui/editor';
import { useContext, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import {
  IntegrationDefinition,
  IntegrationGroup,
  integrationCatalog,
  integrationGroups,
} from './integrationCatalog';
import { integrationStatus, ProviderSetting } from './integrationStatus';
import { IntegrationStatusChip } from './integrationStatusChip';

export const IntegrationListHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 24px;
  margin-bottom: 24px;
`;

export const IntegrationGroups = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  align-items: start;
  gap: 32px 24px;
`;

export const IntegrationGroupSection = styled.section`
  display: grid;
  gap: 12px;
`;

export const IntegrationGroupHeading = styled.div`
  display: grid;
  gap: 2px;
`;

export const IntegrationGrid = styled.div`
  display: grid;
  gap: 12px;
`;

export const IntegrationCardBody = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    'icon title status'
    'icon summary summary'
    'icon providers providers';
  column-gap: 12px;
  row-gap: 6px;
  align-items: center;
  padding: 14px 16px;
  height: 100%;
`;

export const IntegrationIcon = styled.span`
  grid-area: icon;
  align-self: start;
  display: inline-flex;
  font-size: 20px;
  padding: 6px;
  border-radius: 6px;
  color: ${({ theme }) => theme.vars?.palette.text.secondary};
  background: ${({ theme }) => theme.vars?.palette.action.hover};
`;

export const IntegrationSummary = styled(Typography)`
  grid-area: summary;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const IntegrationProviders = styled.div`
  grid-area: providers;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  min-height: 24px;
`;

export const IntegrationLogo = styled.img`
  height: 18px;
  max-width: 72px;
  object-fit: contain;
`;

function IntegrationCard({
  integration,
}: {
  integration: IntegrationDefinition;
}) {
  const titleId = useId();
  const statusId = useId();
  const { data, loading } = useQuery<Record<string, unknown>>(
    integration.query,
    { fetchPolicy: 'cache-and-network' }
  );
  const settings = data?.[integration.dataKey] as ProviderSetting[] | undefined;
  const status = integrationStatus(integration.key, settings);
  const known = !loading || !!settings;
  const Icon = integration.icon;

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{ borderRadius: 1 }}
    >
      <CardActionArea
        component={RouterLink}
        to={integration.path}
        aria-labelledby={titleId}
        aria-describedby={statusId}
        sx={{ height: '100%' }}
      >
        <IntegrationCardBody>
          <IntegrationIcon aria-hidden>
            <Icon />
          </IntegrationIcon>

          <Typography
            variant="subtitle1"
            component="h3"
            id={titleId}
            sx={{ gridArea: 'title', fontWeight: 600, lineHeight: 1.3 }}
          >
            {integration.title}
          </Typography>

          <span
            id={statusId}
            style={{ gridArea: 'status' }}
          >
            {known && <IntegrationStatusChip status={status} />}
          </span>

          <IntegrationSummary
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {integration.summary}
          </IntegrationSummary>

          <IntegrationProviders>
            {status.state === 'notSetUp' ?
              integration.providers
                .filter(provider => provider.logo)
                .map(provider => (
                  <IntegrationLogo
                    key={provider.type}
                    src={provider.logo}
                    alt={provider.label}
                    title={provider.label}
                  />
                ))
            : status.providers.map(provider => (
                <Chip
                  key={provider}
                  size="small"
                  variant="outlined"
                  color={
                    (
                      status.state === 'incomplete' &&
                      status.incomplete.includes(provider)
                    ) ?
                      'warning'
                    : 'default'
                  }
                  label={provider}
                />
              ))
            }
          </IntegrationProviders>
        </IntegrationCardBody>
      </CardActionArea>
    </Card>
  );
}

/** The integrations this user may open, given their roles and the medium's features. */
function useVisibleIntegrations(catalog: IntegrationDefinition[]) {
  const roles = useContext(AuthContext)?.session?.sessionRoles;
  const features = useFeatures();

  return useMemo(
    () =>
      catalog.filter(integration => {
        const permitted =
          !roles ||
          roles.some(role =>
            role.permissions.some(
              permission => permission.id === integration.permission.id
            )
          );
        const featured =
          !integration.feature || !!features?.has(integration.feature);

        return permitted && featured;
      }),
    [catalog, roles, features]
  );
}

/** Integrations matching the query, by title, purpose or provider name. */
export function searchIntegrations(
  integrations: IntegrationDefinition[],
  groups: IntegrationGroup[],
  query: string
) {
  return fuzzySearch(integrations, query, integration => ({
    title: integration.title,
    section: groups.find(group => group.key === integration.group)?.title,
    keywords: integration.providers.map(provider => provider.label),
  })).map(({ item }) => item);
}

export function IntegrationList() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const catalog = useMemo(() => integrationCatalog(t), [t]);
  const visible = useVisibleIntegrations(catalog);
  const allGroups = integrationGroups(t);
  const matching = searchIntegrations(visible, allGroups, query);
  const searching = !!query.trim();

  const groups = allGroups
    .map(group => ({
      ...group,
      items: matching.filter(integration => integration.group === group.key),
    }))
    .filter(group => group.items.length);

  return (
    <div>
      <IntegrationListHeader>
        <div>
          <PageTitle>{t('integrations.title')}</PageTitle>
          <Typography sx={{ color: 'text.secondary', maxWidth: '75ch' }}>
            {t('integrations.overview.intro')}
          </Typography>
        </div>

        {visible.length > 3 && (
          <TextField
            type="search"
            size="small"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('integrations.overview.searchPlaceholder')}
            sx={{ width: { xs: '100%', sm: 320 } }}
            slotProps={{
              htmlInput: { 'aria-label': t('integrations.overview.search') },
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
      </IntegrationListHeader>

      {searching && !matching.length && (
        <Typography sx={{ color: 'text.secondary' }}>
          {t('integrations.overview.noMatch')}
        </Typography>
      )}

      <IntegrationGroups>
        {groups.map(group => (
          <IntegrationGroupSection
            key={group.key}
            aria-labelledby={`integration-group-${group.key}`}
          >
            <IntegrationGroupHeading>
              <Typography
                variant="h6"
                component="h2"
                id={`integration-group-${group.key}`}
              >
                {group.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary' }}
              >
                {group.description}
              </Typography>
            </IntegrationGroupHeading>

            {group.note && group.items.length > 1 && (
              <Alert
                severity="info"
                sx={{ paddingY: 0, typography: 'body2' }}
              >
                {group.note}
              </Alert>
            )}

            <IntegrationGrid>
              {group.items.map(integration => (
                <IntegrationCard
                  key={integration.key}
                  integration={integration}
                />
              ))}
            </IntegrationGrid>
          </IntegrationGroupSection>
        ))}
      </IntegrationGroups>
    </div>
  );
}
