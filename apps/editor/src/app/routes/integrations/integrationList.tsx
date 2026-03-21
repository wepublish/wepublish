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
  CanGetMailProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetTrackingPixelSettings,
} from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import {
  MdAnalytics,
  MdCreditCard,
  MdEmail,
  MdSecurity,
  MdSmartToy,
} from 'react-icons/md';
import { Link } from 'react-router-dom';

import bexioLogo from './assets/bexio.webp';
import cloudflareLogo from './assets/cloudflare.svg';
import hcaptchaLogo from './assets/hcaptcha.webp';
import googleLogo from './assets/google.svg';
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

const Title = styled.h3`
  grid-column: -1/1;
`;

const LogoList = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
  justify-content: space-around;
`;

const IntegrationLogo = styled.img`
  height: 32px;
  object-fit: contain;
`;

export function IntegrationList() {
  const { t } = useTranslation();

  const integrations = [
    {
      title: t('integrations.ai'),
      permission: CanGetAISettings.id,
      path: '/integrations/ai',
      icon: MdSmartToy,
      logos: [vercelLogo],
    },
    {
      title: t('integrations.challengeProvider'),
      permission: CanGetChallengeProviderSettings.id,
      path: '/integrations/challenge',
      icon: MdSecurity,
      logos: [cloudflareLogo, hcaptchaLogo],
    },
    {
      title: t('integrations.paymentProvider'),
      permission: CanGetPaymentProviderSettings.id,
      path: '/integrations/payment',
      icon: MdCreditCard,
      logos: [payrexxLogo, stripeLogo, mollieLogo, bexioLogo],
    },
    {
      title: t('integrations.trackingPixel'),
      permission: CanGetTrackingPixelSettings.id,
      path: '/integrations/tracking-pixel',
      icon: MdAnalytics,
      logos: [proLitterisLogo],
    },
    {
      title: t('integrations.mailProvider'),
      permission: CanGetMailProviderSettings.id,
      path: '/integrations/mail',
      icon: MdEmail,
      logos: [mailgunLogo, mailChimpLogo, slackLogo],
    },
    {
      title: t('integrations.analytics'),
      permission: CanGetAnalyticsProviderSettings.id,
      path: '/integrations/analytics',
      icon: MdAnalytics,
      logos: [googleLogo],
    },
  ];

  return (
    <Wrapper>
      <Title>{t('integrations.title')}</Title>

      {integrations.map(integration => (
        <PermissionControl
          key={integration.title}
          qualifyingPermissions={[integration.permission]}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="h6"
                component="div"
                marginBottom={2}
              >
                {integration.title}
              </Typography>

              <LogoList>
                {integration.logos.map((logo, index) => (
                  <IntegrationLogo
                    key={index}
                    src={logo}
                  />
                ))}
              </LogoList>
            </CardContent>

            <CardActions>
              <Link to={integration.path}>
                <Button size="small">{t('edit')}</Button>
              </Link>
            </CardActions>
          </Card>
        </PermissionControl>
      ))}
    </Wrapper>
  );
}
