import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import { AuthContext, PageTitle, useFeatures } from '@wepublish/ui/editor';
import { useContext, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowForward } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import {
  IntegrationDefinition,
  integrationCatalog,
  integrationGroups,
} from './integrationCatalog';
import { integrationStatus, ProviderSetting } from './integrationStatus';
import { IntegrationStatusChip } from './integrationStatusChip';

export const IntegrationGroupSection = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  & + & {
    margin-top: ${({ theme }) => theme.spacing(5)};
  }
`;

export const IntegrationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const IntegrationCardHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
`;

export const IntegrationLogoList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
`;

export const IntegrationLogo = styled.img`
  height: 24px;
  max-width: 96px;
  object-fit: contain;
`;

export const IntegrationCardFooter = styled(CardActions)`
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

const ProviderChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

function IntegrationCard({
  integration,
}: {
  integration: IntegrationDefinition;
}) {
  const { t } = useTranslation();
  const titleId = useId();
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
      sx={{ borderRadius: 1, display: 'flex', flexDirection: 'column' }}
    >
      <CardContent
        sx={{ flexGrow: 1, display: 'grid', gap: 2, alignContent: 'start' }}
      >
        <IntegrationCardHeader>
          <Avatar
            variant="rounded"
            sx={{ bgcolor: 'action.selected', color: 'text.primary' }}
          >
            <Icon aria-hidden />
          </Avatar>

          <Typography
            variant="h6"
            component="h3"
            id={titleId}
          >
            {integration.title}
          </Typography>
        </IntegrationCardHeader>

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >
          {integration.summary}
        </Typography>

        {status.state === 'notSetUp' ?
          <IntegrationLogoList>
            {integration.providers
              .filter(provider => provider.logo)
              .map(provider => (
                <IntegrationLogo
                  key={provider.type}
                  src={provider.logo}
                  alt={provider.label}
                  title={provider.label}
                />
              ))}
          </IntegrationLogoList>
        : <ProviderChips>
            {status.providers.map(provider => (
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
            ))}
          </ProviderChips>
        }
      </CardContent>

      <IntegrationCardFooter>
        {known ?
          <IntegrationStatusChip status={status} />
        : <span />}

        <Button
          component={RouterLink}
          to={integration.path}
          size="small"
          variant={status.state === 'notSetUp' ? 'contained' : 'text'}
          endIcon={<MdArrowForward />}
          aria-describedby={titleId}
        >
          {status.state === 'notSetUp' ?
            t('integrations.overview.setUp')
          : t('integrations.overview.manage')}
        </Button>
      </IntegrationCardFooter>
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

export function IntegrationList() {
  const { t } = useTranslation();
  const catalog = useMemo(() => integrationCatalog(t), [t]);
  const visible = useVisibleIntegrations(catalog);

  const groups = integrationGroups(t)
    .map(group => ({
      ...group,
      items: visible.filter(integration => integration.group === group.key),
    }))
    .filter(group => group.items.length);

  return (
    <div>
      <PageTitle>{t('integrations.title')}</PageTitle>

      <Typography
        sx={{ color: 'text.secondary', marginBottom: 4, maxWidth: '75ch' }}
      >
        {t('integrations.overview.intro')}
      </Typography>

      {groups.map(group => (
        <IntegrationGroupSection
          key={group.key}
          aria-labelledby={`integration-group-${group.key}`}
        >
          <div>
            <Typography
              variant="h5"
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
          </div>

          {group.note && group.items.length > 1 && (
            <Alert severity="info">{group.note}</Alert>
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
    </div>
  );
}
