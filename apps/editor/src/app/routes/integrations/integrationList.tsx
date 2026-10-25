import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import {
  CanGetAISettings,
  CanGetAnalyticsProviderSettings,
  CanGetChallengeProviderSettings,
  CanGetMailchimpSyncSettings,
  CanGetMailProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetTrackingPixelSettings,
} from '@wepublish/permissions';
import {
  InfoTooltip,
  PageTitle,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAnalytics,
  MdCreditCard,
  MdEmail,
  MdSecurity,
  MdSmartToy,
  MdSync,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import bexioLogo from './assets/bexio.webp';
import cloudflareLogo from './assets/cloudflare.svg';
import googleLogo from './assets/google.svg';
import hcaptchaLogo from './assets/hcaptcha.webp';
import mailChimpLogo from './assets/mailchimp.webp';
import mailgunLogo from './assets/mailgun.svg';
import mollieLogo from './assets/mollie.webp';
import payrexxLogo from './assets/payrexx.webp';
import proLitterisLogo from './assets/proLitteris.svg';
import slackLogo from './assets/slack.webp';
import stripeLogo from './assets/stripe.svg';
import vercelLogo from './assets/vercel.svg';

const Wrapper = styled.div`
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

const Title = styled(PageTitle)`
  grid-column: -1/1;
`;

const LogoList = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: space-around;
`;

const IntegrationLogo = styled.img`
  height: 32px;
  object-fit: contain;
`;

export function IntegrationList() {
  const { t } = useTranslation();
  const listId = useId();
  const titleId = (path: string) =>
    `${listId}${path.replace(/\//g, '-')}-title`;

  const integrations = [
    {
      title: t('integrations.ai'),
      info: t('integrations.aiInfo'),
      permission: CanGetAISettings.id,
      path: '/integrations/ai',
      icon: MdSmartToy,
      logos: [{ src: vercelLogo, name: 'Vercel' }],
    },
    {
      title: t('integrations.challengeProvider'),
      info: t('integrations.challengeProviderInfo'),
      permission: CanGetChallengeProviderSettings.id,
      path: '/integrations/challenge',
      icon: MdSecurity,
      logos: [
        { src: cloudflareLogo, name: 'Cloudflare' },
        { src: hcaptchaLogo, name: 'hCaptcha' },
      ],
    },
    {
      title: t('integrations.paymentProvider'),
      info: t('integrations.paymentProviderInfo'),
      permission: CanGetPaymentProviderSettings.id,
      path: '/integrations/payment',
      icon: MdCreditCard,
      logos: [
        { src: payrexxLogo, name: 'Payrexx' },
        { src: stripeLogo, name: 'Stripe' },
        { src: mollieLogo, name: 'Mollie' },
        { src: bexioLogo, name: 'bexio' },
      ],
    },
    {
      title: t('integrations.trackingPixel'),
      info: t('integrations.trackingPixelInfo'),
      permission: CanGetTrackingPixelSettings.id,
      path: '/integrations/tracking-pixel',
      icon: MdAnalytics,
      logos: [{ src: proLitterisLogo, name: 'ProLitteris' }],
    },
    {
      title: t('integrations.mailProvider'),
      info: t('integrations.mailProviderInfo'),
      permission: CanGetMailProviderSettings.id,
      path: '/integrations/mail',
      icon: MdEmail,
      logos: [
        { src: mailgunLogo, name: 'Mailgun' },
        { src: mailChimpLogo, name: 'Mailchimp' },
        { src: slackLogo, name: 'Slack' },
      ],
    },
    {
      title: t('integrations.analytics'),
      info: t('integrations.analyticsInfo'),
      permission: CanGetAnalyticsProviderSettings.id,
      path: '/integrations/analytics',
      icon: MdAnalytics,
      logos: [{ src: googleLogo, name: 'Google' }],
    },
    {
      title: t('integrations.mailchimpSync'),
      info: t('integrations.mailchimpSyncInfo'),
      permission: CanGetMailchimpSyncSettings.id,
      path: '/integrations/mailchimp-sync',
      icon: MdSync,
      logos: [{ src: mailChimpLogo, name: 'Mailchimp' }],
    },
  ];

  return (
    <Wrapper>
      <Title>
        {t('integrations.title')}{' '}
        <InfoTooltip text={t('integrations.infoText')} />
      </Title>
      {integrations.map(integration => (
        <PermissionControl
          key={integration.title}
          qualifyingPermissions={[integration.permission]}
        >
          <Card
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            <CardContent>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  marginBottom: 2,
                }}
              >
                <span id={titleId(integration.path)}>{integration.title}</span>{' '}
                <InfoTooltip text={integration.info} />
              </Typography>

              <LogoList>
                {integration.logos.map(logo => (
                  <IntegrationLogo
                    key={logo.name}
                    src={logo.src}
                    alt={logo.name}
                  />
                ))}
              </LogoList>
            </CardContent>

            <CardActions>
              <Button
                component={RouterLink}
                to={integration.path}
                size="small"
                aria-describedby={titleId(integration.path)}
              >
                {t('edit')}
              </Button>
            </CardActions>
          </Card>
        </PermissionControl>
      ))}
    </Wrapper>
  );
}
