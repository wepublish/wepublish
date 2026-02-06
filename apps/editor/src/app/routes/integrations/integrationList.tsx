import { PermissionControl } from '@wepublish/ui/editor';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import {
  MdAnalytics,
  MdCreditCard,
  MdEmail,
  MdSecurity,
  MdSmartToy,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Col, Grid, Panel, Row } from 'rsuite';

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
  svg {
    margin-right: 10px;
  }
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
    },
    {
      title: t('integrations.challengeProvider'),
      permission: 'CAN_GET_CHALLENGE_PROVIDER_SETTINGS',
      path: '/integrations/challenge',
      icon: MdSecurity,
    },
    {
      title: t('integrations.paymentProvider'),
      permission: 'CAN_GET_PAYMENT_PROVIDER_SETTINGS',
      path: '/integrations/payment',
      icon: MdCreditCard,
    },
    {
      title: t('integrations.trackingPixel'),
      permission: 'CAN_GET_TRACKING_PIXEL_SETTINGS',
      path: '/integrations/tracking-pixel',
      icon: MdAnalytics,
    },
    {
      title: t('integrations.mailProvider'),
      permission: 'CAN_GET_MAIL_PROVIDER_SETTINGS',
      path: '/integrations/mail',
      icon: MdEmail,
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
              xl={6}
            >
              <StyledPanel
                shaded
                bordered
                header={
                  <StyledHeader>
                    <integration.icon />
                    {integration.title}
                  </StyledHeader>
                }
                onClick={() => navigate(integration.path)}
              >
                <p>
                  {t('integrations.manage', { integration: integration.title })}
                </p>
              </StyledPanel>
            </StyledCol>
          </PermissionControl>
        ))}
      </StyledRow>
    </Grid>
  );
}
