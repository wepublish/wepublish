import { useMutation, useQuery } from '@apollo/client/react';
import {
  MailTemplateDocument,
  MailTemplateMissingPlaceholdersDocument,
  SendMailTemplateToUserDocument,
} from '@wepublish/editor/api';
import {
  humanizeError,
  PermissionControl,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSend } from 'react-icons/md';
import { SelectPicker } from 'rsuite';
import { showErrors, useShowErrors } from '../common';
import { Alert, Button, Stack } from '@mui/material';

interface SendMailToUserPanelProps {
  userId: string;
}

/**
 * Lets an editor manually send any mail template to a single user. A single
 * user carries no subscription data, so the panel warns when the chosen
 * template uses placeholders that would render empty — but never blocks.
 */
export function SendMailToUserPanel({ userId }: SendMailToUserPanelProps) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState<string | null>(null);

  const { data, error: templateError } = useQuery(MailTemplateDocument);

  useEffect(() => {
    if (templateError) {
      showErrors(templateError);
    }
  }, [templateError]);
  const { data: missingData, error: missingError } = useQuery(
    MailTemplateMissingPlaceholdersDocument,
    {
      skip: !templateId,
      variables: {
        templateId: templateId as string,
        withSubscriptionData: false,
      },
    }
  );
  useShowErrors(missingError);

  const [sendMail, { loading }] = useMutation(SendMailTemplateToUserDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), { variant: 'error' }),
    onCompleted: () =>
      enqueueSnackbar(t('userMail.sent'), {
        variant: 'success',
        autoHideDuration: 3000,
      }),
    refetchQueries: ['MailLogs'],
  });

  const missing = missingData?.mailTemplateMissingPlaceholders ?? [];

  const onSend = async () => {
    if (!templateId) {
      return;
    }
    await sendMail({ variables: { templateId, userId } });
  };

  return (
    <Stack
      sx={{ alignItems: 'stretch' }}
      direction="column"
      spacing={1.5}
    >
      <SelectPicker
        block
        data={(data?.mailTemplates ?? []).map(template => ({
          label: template.name,
          value: template.id,
        }))}
        value={templateId}
        onChange={setTemplateId}
        placeholder={t('userMail.selectTemplate')}
      />

      {templateId && missing.length > 0 && (
        <Alert severity="warning">
          {t('mailSend.missingPlaceholders', {
            placeholders: missing.join(', '),
          })}
        </Alert>
      )}

      <PermissionControl
        showRejectionMessage={false}
        qualifyingPermissions={['CAN_SEND_MAIL-TEMPLATES']}
      >
        <Button
          variant="contained"
          disabled={!templateId}
          loading={loading}
          onClick={onSend}
        >
          <MdSend /> {t('userMail.send')}
        </Button>
      </PermissionControl>
    </Stack>
  );
}
