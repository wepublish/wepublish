import styled from '@emotion/styled';
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
  MdEdit,
  MdEmail,
  MdSecurity,
  MdSmartToy,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Col, Grid, IconButton, Panel, Row } from 'rsuite';

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

const StyledRow = styled(Row)`
  margin-top: 20px;
`;

const StyledCol = styled(Col)`
  margin-bottom: 20px;
`;

const StyledPanel = styled(Panel)`
  cursor: pointer;
  background-color: white;
`;

const StyledHeader = styled.h3`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoList = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
  justify-content: space-around;
`;

const IntegrationLogo = styled.img`
  width: 64px;
  object-fit: contain;
`;

export function IntegrationList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    <Grid fluid>
      <Row>
        <Col xs={24}>
          <h1>{t('integrations.title')}</h1>
        </Col>
      </Row>

      <StyledRow gutter={20}>
        {integrations.map(integration => (
          <PermissionControl
            key={integration.permission}
            qualifyingPermissions={[integration.permission]}
          >
            <StyledCol
              xs={24}
              md={12}
              lg={8}
            >
              <StyledPanel
                shaded
                bordered
                header={
                  <StyledHeader>
                    {integration.title}
                    <IconButton
                      icon={<MdEdit />}
                      circle
                      appearance="primary"
                    />
                  </StyledHeader>
                }
                onClick={() => navigate(integration.path)}
              >
                {integration.logos.length > 0 && (
                  <LogoList>
                    {integration.logos.map((logo, index) => (
                      <IntegrationLogo
                        key={index}
                        src={logo}
                      />
                    ))}
                  </LogoList>
                )}
              </StyledPanel>
            </StyledCol>
          </PermissionControl>
        ))}
      </StyledRow>
    </Grid>
  );
}
