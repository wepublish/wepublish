import { PermissionControl } from '@wepublish/ui/editor';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import {
  MdAnalytics,
  MdChevronRight,
  MdCreditCard,
  MdEdit,
  MdEmail,
  MdSecurity,
  MdSmartToy,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Button, Col, Grid, IconButton, Panel, Row } from 'rsuite';

import mailChimpLogo from '../../../assets/integrations/mailchimp.avif';
import slackLogo from '../../../assets/integrations/slack.png';
import mailgunLogo from '../../../assets/integrations/mailgun.svg';
import bexioLogo from '../../../assets/integrations/bexio.png';
import mollieLogo from '../../../assets/integrations/mollie.png';
import payrexxLogo from '../../../assets/integrations/payrexx.png';
import stripeLogo from '../../../assets/integrations/stripe.svg';
import proLitterisLogo from '../../../assets/integrations/proLitteris.svg';
import vercelLogo from '../../../assets/integrations/vercel.svg';
import cloudflareLogo from '../../../assets/integrations/cloudflare.svg';

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
      permission: 'CAN_GET_AI_SETTINGS',
      path: '/integrations/ai',
      icon: MdSmartToy,
      logos: [vercelLogo],
    },
    {
      title: t('integrations.challengeProvider'),
      permission: 'CAN_GET_CHALLENGE_PROVIDER_SETTINGS',
      path: '/integrations/challenge',
      icon: MdSecurity,
      logos: [cloudflareLogo],
    },
    {
      title: t('integrations.paymentProvider'),
      permission: 'CAN_GET_PAYMENT_PROVIDER_SETTINGS',
      path: '/integrations/payment',
      icon: MdCreditCard,
      logos: [payrexxLogo, stripeLogo, mollieLogo, bexioLogo],
    },
    {
      title: t('integrations.trackingPixel'),
      permission: 'CAN_GET_TRACKING_PIXEL_SETTINGS',
      path: '/integrations/tracking-pixel',
      icon: MdAnalytics,
      logos: [proLitterisLogo],
    },
    {
      title: t('integrations.mailProvider'),
      permission: 'CAN_GET_MAIL_PROVIDER_SETTINGS',
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
            qualifyingPermissions={[integration.permission as any]}
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
