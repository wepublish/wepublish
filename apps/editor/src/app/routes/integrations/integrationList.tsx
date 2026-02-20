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

import bexioLogo from '../../../assets/integrations/bexio.png';
import cloudflareLogo from '../../../assets/integrations/cloudflare.svg';
import mailChimpLogo from '../../../assets/integrations/mailchimp.avif';
import mailgunLogo from '../../../assets/integrations/mailgun.svg';
import mollieLogo from '../../../assets/integrations/mollie.png';
import payrexxLogo from '../../../assets/integrations/payrexx.png';
import proLitterisLogo from '../../../assets/integrations/proLitteris.svg';
import slackLogo from '../../../assets/integrations/slack.png';
import stripeLogo from '../../../assets/integrations/stripe.svg';
import vercelLogo from '../../../assets/integrations/vercel.svg';
import { Message } from 'rsuite';

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

const StyledLink = styled(Link)`
  text-decoration: none;
  color: unset;

  &:hover {
    text-decoration: none;
    color: unset;
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
      logos: [cloudflareLogo],
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
  ];

  return (
    <Wrapper>
      <Title>{t('integrations.title')}</Title>
      <Message
        type="info"
        showIcon
        header={t('integrations.whatAreIntegrations')}
      >
        {t('integrations.infoText')}
      </Message>

      {integrations.map(integration => (
        <PermissionControl
          key={integration.title}
          qualifyingPermissions={[integration.permission]}
        >
          <StyledLink to={integration.path}>
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
          </StyledLink>
        </PermissionControl>
      ))}
    </Wrapper>
  );
}
