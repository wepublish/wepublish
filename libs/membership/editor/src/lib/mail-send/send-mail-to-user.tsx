import { useMutation, useQuery } from '@apollo/client/react';
import {
  MailTemplateDocument,
  MailTemplateMissingPlaceholdersDocument,
  SendMailTemplateToUserDocument,
} from '@wepublish/editor/api';
import { PermissionControl } from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSend } from 'react-icons/md';
import { Button, Message, SelectPicker, Stack, toaster } from 'rsuite';
import { showErrors, useShowErrors } from '../common';

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
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {error.message}
        </Message>
      ),
    onCompleted: () =>
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('userMail.sent')}
        </Message>
      ),
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
      direction="column"
      spacing={12}
      alignItems="stretch"
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
        <Message type="warning">
          {t('mailSend.missingPlaceholders', {
            placeholders: missing.join(', '),
          })}
        </Message>
      )}

      <PermissionControl
        showRejectionMessage={false}
        qualifyingPermissions={['CAN_SEND_MAIL-TEMPLATES']}
      >
        <Button
          appearance="primary"
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
