import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import {
  useWebsiteSettingsQuery,
  WebsiteSettings,
} from '@wepublish/editor/api';
import { CanGetAISettings } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdsClick,
  MdAnalytics,
  MdCheck,
  MdClose,
  MdMail,
  MdWarning,
} from 'react-icons/md';
import { Link } from 'react-router-dom';

const WebsiteSettingsListWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Title = styled.h3`
  grid-column: -1/1;
`;

const CardTitle = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 8px;
  align-items: center;
`;

const CardIntegration = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 8px;
  align-items: center;
`;

export const WebsiteSettingsList = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const { data, loading } = useWebsiteSettingsQuery();

  const settings = useMemo(() => {
    if (loading || !data) {
      return [];
    }

    const analyticsIntegrations = [
      { id: 'googleAnalytics', text: 'Google Analytics' },
      { id: 'googleTagManager', text: 'Google Tag Manager' },
      { id: 'plausible', text: 'Plausible Analytics' },
    ] as Array<{
      id: Exclude<keyof WebsiteSettings['analytics'], '__typename'>;
      text: string;
    }>;

    const mailIntegrations = [{ id: 'mailchimp', text: 'Mailchimp' }] as Array<{
      id: Exclude<keyof WebsiteSettings['mail'], '__typename'>;
      text: string;
    }>;

    const adsIntegrations = [{ id: 'sparkLoop', text: 'SparkLoop' }] as Array<{
      id: Exclude<keyof WebsiteSettings['ads'], '__typename'>;
      text: string;
    }>;

    return [
      {
        title: t('websiteSettings.analytics.title'),
        permission: CanGetAISettings.id,
        path: '/settings/website/analytics',
        icon: <MdAnalytics size={24} />,
        enabledIntegrations: analyticsIntegrations.filter(
          integration =>
            data.websiteSettings.analytics[integration.id]?.enabled &&
            data.websiteSettings.analytics[integration.id]?.key
        ),
        faulyIntegrations: analyticsIntegrations.filter(
          integration =>
            data.websiteSettings.analytics[integration.id]?.enabled &&
            !data.websiteSettings.analytics[integration.id]?.key
        ),
        disabledIntegrations: analyticsIntegrations.filter(
          integration =>
            !data.websiteSettings.analytics[integration.id]?.enabled
        ),
      },
      {
        title: t('websiteSettings.mail.title'),
        permission: CanGetAISettings.id,
        path: '/settings/website/mail',
        icon: <MdMail size={24} />,
        enabledIntegrations: mailIntegrations.filter(
          integration =>
            data.websiteSettings.mail[integration.id]?.enabled &&
            data.websiteSettings.mail[integration.id]?.key
        ),
        faulyIntegrations: mailIntegrations.filter(
          integration =>
            data.websiteSettings.mail[integration.id]?.enabled &&
            !data.websiteSettings.mail[integration.id]?.key
        ),
        disabledIntegrations: mailIntegrations.filter(
          integration => !data.websiteSettings.mail[integration.id]?.enabled
        ),
      },
      {
        title: t('websiteSettings.ads.title'),
        permission: CanGetAISettings.id,
        path: '/settings/website/ads',
        icon: <MdAdsClick size={24} />,
        enabledIntegrations: adsIntegrations.filter(
          integration =>
            data.websiteSettings.ads[integration.id]?.enabled &&
            data.websiteSettings.ads[integration.id]?.key
        ),
        faulyIntegrations: adsIntegrations.filter(
          integration =>
            data.websiteSettings.ads[integration.id]?.enabled &&
            !data.websiteSettings.ads[integration.id]?.key
        ),
        disabledIntegrations: adsIntegrations.filter(
          integration => !data.websiteSettings.ads[integration.id]?.enabled
        ),
      },
    ];
  }, [data, loading, t]);

  return (
    <WebsiteSettingsListWrapper>
      <Title>{t('websiteSettings.list.title')}</Title>

      {settings.map(category => (
        <PermissionControl
          key={category.title}
          qualifyingPermissions={[category.permission]}
        >
          <Card
            variant="outlined"
            sx={{ display: 'flex', flexFlow: 'column' }}
          >
            <CardContent sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                component={CardTitle}
                marginBottom={2}
              >
                {category.icon}
                {category.title}
              </Typography>

              {category.faulyIntegrations.map((integration, index) => (
                <Typography
                  variant="body2"
                  component={CardIntegration}
                  key={index}
                >
                  <MdWarning color={theme.palette.error.main} />
                  {integration.text}
                </Typography>
              ))}

              {!!category.faulyIntegrations.length &&
                !!category.enabledIntegrations.length && <Box pt={1} />}

              {category.enabledIntegrations.map((integration, index) => (
                <Typography
                  variant="body2"
                  component={CardIntegration}
                  key={index}
                >
                  <MdCheck color={theme.palette.success.main} />
                  {integration.text}
                </Typography>
              ))}

              {!!category.enabledIntegrations.length &&
                !!category.disabledIntegrations.length && <Box pt={1} />}

              {category.disabledIntegrations.map((integration, index) => (
                <Typography
                  variant="body2"
                  component={CardIntegration}
                  key={index}
                >
                  <MdClose color={theme.palette.info.main} />
                  {integration.text}
                </Typography>
              ))}
            </CardContent>
            <CardActions>
              <Link to={category.path}>
                <Button size="small">{t('edit')}</Button>
              </Link>
            </CardActions>
          </Card>
        </PermissionControl>
      ))}
    </WebsiteSettingsListWrapper>
  );
};
