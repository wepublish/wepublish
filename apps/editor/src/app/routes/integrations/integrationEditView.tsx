import { Button } from '@mui/material';
import {
  CanGetAISettings,
  CanGetAnalyticsProviderSettings,
  CanGetChallengeProviderSettings,
  CanGetMailchimpSyncSettings,
  CanGetMailProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetTrackingPixelSettings,
  Permission,
} from '@wepublish/permissions';
import { InfoTooltip, PermissionControl } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link, useParams } from 'react-router-dom';

import { AIIntegrationForm } from './aiIntegrationForm';
import { AnalyticsIntegrationForm } from './analyticsIntegrationForm';
import { ChallengeIntegrationForm } from './challengeIntegrationForm';
import { MailchimpSyncIntegrationForm } from './mailchimpSyncIntegrationForm';
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
    case 'analytics':
      return t('integrations.analytics');
    case 'mail':
      return t('integrations.mailProvider');
    case 'mailchimp-sync':
      return t('integrations.mailchimpSync');
    default:
      return t('integrations.unknown');
  }
};

const useIntegrationInfo = (type: string | undefined) => {
  const { t } = useTranslation();

  switch (type) {
    case 'ai':
      return t('integrations.aiInfo');
    case 'challenge':
      return t('integrations.challengeProviderInfo');
    case 'payment':
      return t('integrations.paymentProviderInfo');
    case 'tracking-pixel':
      return t('integrations.trackingPixelInfo');
    case 'analytics':
      return t('integrations.analyticsInfo');
    case 'mail':
      return t('integrations.mailProviderInfo');
    case 'mailchimp-sync':
      return t('integrations.mailchimpSyncInfo');
    default:
      return undefined;
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
    case 'analytics':
      return CanGetAnalyticsProviderSettings;
    case 'mail':
      return CanGetMailProviderSettings;
    case 'mailchimp-sync':
      return CanGetMailchimpSyncSettings;
    default:
      return;
  }
};

export function IntegrationEditView() {
  const { t } = useTranslation();
  const { type } = useParams();

  const permission = getPermission(type);
  const title = useIntegrationTitle(type);
  const info = useIntegrationInfo(type);

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
      case 'analytics':
        return <AnalyticsIntegrationForm />;
      case 'mailchimp-sync':
        return <MailchimpSyncIntegrationForm />;
      default:
        return <p>{t('integrations.configure', { integration: title })}</p>;
    }
  })();

  return (
    <PermissionControl
      qualifyingPermissions={permission ? [permission.id] : []}
    >
      <div>
        <Link to={'/integrations'}>
          <Button
            size="small"
            variant="text"
            startIcon={<MdArrowBack />}
          >
            {t('integrations.back')}
          </Button>
        </Link>

        <h1>
          {title}
          {info && (
            <>
              {' '}
              <InfoTooltip text={info} />
            </>
          )}
        </h1>

        <div style={{ marginTop: 20 }}>{renderConfiguration}</div>
      </div>
    </PermissionControl>
  );
}
