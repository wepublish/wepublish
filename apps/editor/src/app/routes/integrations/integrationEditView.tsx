import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Avatar, Button, Link, Typography } from '@mui/material';
import { PermissionControl } from '@wepublish/ui/editor';
import { ComponentType, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { AIIntegrationForm } from './aiIntegrationForm';
import { AnalyticsIntegrationForm } from './analyticsIntegrationForm';
import { ChallengeIntegrationForm } from './challengeIntegrationForm';
import {
  IntegrationDefinition,
  integrationByPath,
  integrationCatalog,
} from './integrationCatalog';
import {
  IntegrationKey,
  integrationStatus,
  ProviderSetting,
} from './integrationStatus';
import { IntegrationStatusChip } from './integrationStatusChip';
import { LetterIntegrationForm } from './letterIntegrationForm';
import { MailchimpSyncIntegrationForm } from './mailchimpSyncIntegrationForm';
import { MailIntegrationForm } from './mailIntegrationForm';
import { PaymentIntegrationForm } from './paymentIntegrationForm';
import { PdfRendererIntegrationForm } from './pdfRendererIntegrationForm';
import { TrackingPixelIntegrationForm } from './trackingPixelIntegrationForm';

const forms: Record<IntegrationKey, ComponentType> = {
  ai: AIIntegrationForm,
  analytics: AnalyticsIntegrationForm,
  challenge: ChallengeIntegrationForm,
  letter: LetterIntegrationForm,
  mail: MailIntegrationForm,
  'mailchimp-sync': MailchimpSyncIntegrationForm,
  payment: PaymentIntegrationForm,
  'pdf-renderer': PdfRendererIntegrationForm,
  'tracking-pixel': TrackingPixelIntegrationForm,
};

export const IntegrationHeader = styled.header`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
  margin: ${({ theme }) => theme.spacing(1, 0, 3)};
`;

export const IntegrationHeaderTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1, 2)};
`;

export const IntegrationIntro = styled.div`
  grid-column: 1 / -1;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: 80ch;
`;

function IntegrationStatusOf({
  integration,
}: {
  integration: IntegrationDefinition;
}) {
  const { data } = useQuery<Record<string, unknown>>(integration.query);
  const settings = data?.[integration.dataKey] as ProviderSetting[] | undefined;

  if (!settings) {
    return null;
  }

  return (
    <IntegrationStatusChip
      status={integrationStatus(integration.key, settings)}
    />
  );
}

export function IntegrationEditView() {
  const { t } = useTranslation();
  const { type } = useParams();
  const catalog = useMemo(() => integrationCatalog(t), [t]);
  const integration = integrationByPath(catalog, type);

  const back = (
    <Button
      component={RouterLink}
      to={'/integrations'}
      size="small"
      variant="text"
      startIcon={<MdArrowBack />}
    >
      {t('integrations.back')}
    </Button>
  );

  if (!integration) {
    return (
      <div>
        {back}
        <Alert severity="warning">{t('integrations.notFound')}</Alert>
      </div>
    );
  }

  const Form = forms[integration.key];
  const Icon = integration.icon;

  return (
    <PermissionControl
      qualifyingPermissions={[integration.permission.id]}
      showRejectionMessage
    >
      <div>
        {back}

        <IntegrationHeader>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'action.selected',
              color: 'text.primary',
              width: 48,
              height: 48,
            }}
          >
            <Icon
              size={28}
              aria-hidden
            />
          </Avatar>

          <IntegrationHeaderTitle>
            <Typography variant="h1">{integration.title}</Typography>
            <IntegrationStatusOf integration={integration} />
          </IntegrationHeaderTitle>

          <IntegrationIntro>
            <Typography sx={{ color: 'text.secondary' }}>
              {integration.summary}
            </Typography>

            {integration.related?.map(related => {
              const target = integrationByPath(catalog, related.key);

              return (
                target && (
                  <Alert
                    key={related.key}
                    severity="info"
                  >
                    {related.text}{' '}
                    <Link
                      component={RouterLink}
                      to={target.path}
                    >
                      {target.title}
                    </Link>
                  </Alert>
                )
              );
            })}
          </IntegrationIntro>
        </IntegrationHeader>

        <Form />
      </div>
    </PermissionControl>
  );
}
