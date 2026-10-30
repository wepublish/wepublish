import { useMutation, useQuery } from '@apollo/client/react';
import {
  MailTemplateDocument,
  MailTemplateMissingPlaceholdersDocument,
  SendMailTemplateToUserDocument,
} from '@wepublish/editor/api';
import {
  humanizeError,
  enqueueSnackbar,
  createCheckedPermissionComponent,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSend } from 'react-icons/md';
import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { CanSendMailTemplates } from '@wepublish/permissions';

interface SendMailToUserPanelProps {
  userId: string;
}

function SendMailToUserPanel({ userId }: SendMailToUserPanelProps) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState<string | null>(null);

  const { data } = useQuery(MailTemplateDocument);

  const { data: missingData } = useQuery(
    MailTemplateMissingPlaceholdersDocument,
    {
      skip: !templateId,
      variables: {
        templateId: templateId as string,
        withSubscriptionData: false,
      },
    }
  );

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
      {templateId && missing.length > 0 && (
        <Alert severity="warning">
          {t('mailSend.missingPlaceholders', {
            placeholders: missing.join(', '),
          })}
        </Alert>
      )}

      <Stack
        sx={{ alignItems: 'center' }}
        direction="row"
        spacing={1.5}
      >
        <TextField
          select
          label={t('userMail.selectTemplate')}
          value={templateId ?? ''}
          onChange={event => setTemplateId(event.target.value || null)}
          fullWidth
        >
          {(data?.mailTemplates ?? []).map(template => (
            <MenuItem
              key={template.id}
              value={template.id}
            >
              {template.name}
            </MenuItem>
          ))}
        </TextField>

        <Button
          sx={{ flexShrink: 0 }}
          startIcon={<MdSend />}
          variant="text"
          disabled={!templateId}
          loading={loading}
          onClick={onSend}
        >
          {t('userMail.send')}
        </Button>
      </Stack>
    </Stack>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent(
  [CanSendMailTemplates.id],
  false
)(SendMailToUserPanel);

export { CheckedPermissionComponent as SendMailToUserPanel };
