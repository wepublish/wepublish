import {
  CanGetAISettings,
  CanGetChallengeProviderSettings,
  CanGetMailProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetTrackingPixelSettings,
  Permission,
} from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Grid, Panel, Row } from 'rsuite';
import { AIIntegrationForm } from './aiIntegrationForm';
import { ChallengeIntegrationForm } from './challengeIntegrationForm';

export function IntegrationEditView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type } = useParams();

  const getIntegrationTitle = (type: string | undefined) => {
    switch (type) {
      case 'ai':
        return t('integrations.ai');
      case 'challenge':
        return t('integrations.challengeProvider');
      case 'payment':
        return t('integrations.paymentProvider');
      case 'tracking-pixel':
        return t('integrations.trackingPixel');
      case 'mail':
        return t('integrations.mailProvider');
      default:
        return t('integrations.unknown');
    }
  };

  const getPermission = (type: string | undefined): Permission | undefined => {
    switch (type) {
      case 'ai':
        return CanGetAISettings;
      case 'challenge':
        return CanGetChallengeProviderSettings;
      case 'payment':
        return CanGetPaymentProviderSettings;
      case 'tracking-pixel':
        return CanGetTrackingPixelSettings;
      case 'mail':
        return CanGetMailProviderSettings;
      default:
        return;
    }
  };

  const permission = getPermission(type);
  const title = getIntegrationTitle(type);

  const renderConfiguration = () => {
    switch (type) {
      case 'ai':
        return <AIIntegrationForm />;
      case 'challenge':
        return <ChallengeIntegrationForm />;
      default:
        return <p>{t('integrations.configure', { integration: title })}</p>;
    }
  };

  return (
    <PermissionControl
      qualifyingPermissions={permission ? [permission.id] : []}
    >
      <Grid fluid>
        <Row>
          <Col xs={24}>
            <Button
              onClick={() => navigate('/integrations')}
              appearance="subtle"
              startIcon={<MdArrowBack />}
            >
              {t('integrations.back')}
            </Button>
            <h1>{title}</h1>
          </Col>
        </Row>
        <Row style={{ marginTop: 20 }}>
          <Col xs={24}>
            <Panel
              bordered
              style={{ backgroundColor: 'white' }}
            >
              {renderConfiguration()}
            </Panel>
          </Col>
        </Row>
      </Grid>
    </PermissionControl>
  );
}
