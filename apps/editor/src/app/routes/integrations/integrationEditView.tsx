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
import { Button } from 'rsuite';

import { AIIntegrationForm } from './aiIntegrationForm';
import { ChallengeIntegrationForm } from './challengeIntegrationForm';
import { MailIntegrationForm } from './mailIntegrationForm';
import { PaymentIntegrationForm } from './paymentIntegrationForm';
import { TrackingPixelIntegrationForm } from './trackingPixelIntegrationForm';

const useIntegrationTitle = (type: string | undefined) => {
  const { t } = useTranslation();

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

export function IntegrationEditView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type } = useParams();

  const permission = getPermission(type);
  const title = useIntegrationTitle(type);

  const renderConfiguration = (() => {
    switch (type) {
      case 'ai':
        return <AIIntegrationForm />;
      case 'challenge':
        return <ChallengeIntegrationForm />;
      case 'payment':
        return <PaymentIntegrationForm />;
      case 'mail':
        return <MailIntegrationForm />;
      case 'tracking-pixel':
        return <TrackingPixelIntegrationForm />;
      default:
        return <p>{t('integrations.configure', { integration: title })}</p>;
    }
  })();

  return (
    <PermissionControl
      qualifyingPermissions={permission ? [permission.id] : []}
    >
      <div>
        <Button
          onClick={() => navigate('/integrations')}
          appearance="subtle"
          startIcon={<MdArrowBack />}
        >
          {t('integrations.back')}
        </Button>

        <h1>{title}</h1>

        <div style={{ marginTop: 20 }}>{renderConfiguration}</div>
      </div>
    </PermissionControl>
  );
}
