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
import { CanGetAISettings } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdAnalytics, MdCheck, MdClose } from 'react-icons/md';
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

  const settings = [
    {
      title: t('websiteSettings.analytics.title'),
      permission: CanGetAISettings.id,
      path: '/settings/website/analytics',
      icon: <MdAnalytics size={24} />,
      enabledIntegrations: [
        { id: 'GA', text: 'Google Analytics' },
        { id: 'GTM', text: 'Google Tag Manager' },
      ],
      disabledIntegrations: [{ id: 'pa', text: 'Plausible Analytics' }],
    },
  ];

  return (
    <WebsiteSettingsListWrapper>
      <Title>{t('websiteSettings.list.title')}</Title>

      {settings.map(category => (
        <PermissionControl
          key={category.title}
          qualifyingPermissions={[category.permission]}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="h6"
                component={CardTitle}
                marginBottom={2}
              >
                {category.icon}
                {category.title}
              </Typography>

              {category.enabledIntegrations.map(integration => (
                <Typography
                  variant="body2"
                  component={CardIntegration}
                  key={integration.id}
                >
                  <MdCheck color={theme.palette.success.main} />
                  {integration.text}
                </Typography>
              ))}

              {category.enabledIntegrations.length &&
                category.disabledIntegrations.length && <Box pt={1} />}

              {category.disabledIntegrations.map(integration => (
                <Typography
                  variant="body2"
                  component={CardIntegration}
                  key={integration.id}
                >
                  <MdClose color={theme.palette.error.main} />
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
