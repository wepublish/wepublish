import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  MailTemplateDocument,
  SystemMailsDocument,
  TestSystemMailDocument,
  UpdateSystemMailDocument,
  UserEvent,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdManageAccounts, MdUnsubscribe } from 'react-icons/md';
import { RiTestTubeLine } from 'react-icons/ri';
import {
  DEFAULT_MUTATION_OPTIONS,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
} from '../common';
import { EventList, EventRow, MailBlock } from '../mail-settings-layout';
import { formatTemplateLabel } from '../mail-template/mail-placeholders';
import { Button, MenuItem, TextField } from '@mui/material';
import {
  CanGetSystemMails,
  CanTestSystemMails,
  CanUpdateSystemMails,
} from '@wepublish/permissions';

/**
 * Display order of the account events. Events not listed here are appended, so
 * newly added ones still show up.
 */
const ACCOUNT_EVENT_ORDER: UserEvent[] = [
  UserEvent.AccountCreation,
  UserEvent.LoginLink,
  UserEvent.PasswordReset,
  UserEvent.EmailChange,
  UserEvent.TestMail,
];

const Controls = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  > .rs-picker {
    flex: 1 1 200px;
    min-width: 0;
  }
`;

function SystemMailSection() {
  const { t } = useTranslation();

  const { data: systemMails } = useQuery(SystemMailsDocument);
  const { data: mailTemplates } = useQuery(MailTemplateDocument);

  const [updateSystemMail] = useMutation(
    UpdateSystemMailDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [testSystemMail] = useMutation(
    TestSystemMailDocument,
    MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('systemMails.testSent'))
  );

  const canUpdateSystemMails = useAuthorisation(CanUpdateSystemMails.id);

  // The update mutation returns objects without an id, so the Apollo cache cannot
  // patch the query result. Keep the local selection to reflect saved changes.
  const [assignedTemplates, setAssignedTemplates] = useState<
    Partial<Record<UserEvent, string | null>>
  >({});

  const events = useMemo(() => {
    if (!systemMails) {
      return [];
    }

    return [...systemMails.systemMails].sort((a, b) => {
      const orderA = ACCOUNT_EVENT_ORDER.indexOf(a.event);
      const orderB = ACCOUNT_EVENT_ORDER.indexOf(b.event);

      return (
        (orderA < 0 ? ACCOUNT_EVENT_ORDER.length : orderA) -
        (orderB < 0 ? ACCOUNT_EVENT_ORDER.length : orderB)
      );
    });
  }, [systemMails]);

  const templateOptions = useMemo(
    () =>
      (mailTemplates?.mailTemplates || []).map(mailTemplate => ({
        label: formatTemplateLabel(
          mailTemplate.name,
          mailTemplate.context,
          (k, f) => t(k, f)
        ),
        value: mailTemplate.id,
      })),
    [mailTemplates, t]
  );

  function assignedTemplateId(event: UserEvent, mailTemplateId?: string) {
    if (event in assignedTemplates) {
      return assignedTemplates[event];
    }

    return mailTemplateId ?? null;
  }

  async function assignTemplate(
    event: UserEvent,
    mailTemplateId: string | null
  ) {
    setAssignedTemplates(current => ({ ...current, [event]: mailTemplateId }));

    await updateSystemMail({
      variables: {
        event,
        mailTemplateId,
      },
    });
  }

  if (!events.length || !mailTemplates) {
    return null;
  }

  return (
    <MailBlock
      title={t('systemMails.title')}
      icon={<MdManageAccounts size={20} />}
      description={t('systemMails.sectionDescription')}
      example={t('systemMails.sectionExample')}
    >
      <EventList>
        {events.map(systemMail => {
          const eventKey = systemMail.event.toLowerCase();
          const mailTemplateId = assignedTemplateId(
            systemMail.event,
            systemMail.mailTemplate?.id
          );

          return (
            <EventRow
              key={systemMail.event}
              title={t(`systemMails.events.${eventKey}`)}
              hint={t(`systemMails.eventInfo.${eventKey}.short`)}
              description={t(`systemMails.eventInfo.${eventKey}.description`)}
              example={t(`systemMails.eventInfo.${eventKey}.example`)}
            >
              <Controls>
                <TextField
                  select
                  disabled={!canUpdateSystemMails}
                  value={systemMail.mailTemplate?.id ?? ''}
                  onChange={event =>
                    assignTemplate(systemMail.event, event.target.value || null)
                  }
                  slotProps={{
                    select: {
                      displayEmpty: true,
                      SelectDisplayProps: {
                        'aria-label': t(`systemMails.events.${eventKey}`),
                      } as object,
                    },
                  }}
                  fullWidth
                >
                  <MenuItem value="">
                    <MdUnsubscribe
                      size={16}
                      style={{ marginRight: '5px' }}
                    />
                    {t('mailTemplateSelect.noMailSentSelectNow')}
                  </MenuItem>

                  {templateOptions.map(option => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <PermissionControl
                  showRejectionMessage={false}
                  qualifyingPermissions={[CanTestSystemMails.id]}
                >
                  <Button
                    variant="outlined"
                    startIcon={<RiTestTubeLine />}
                    disabled={!mailTemplateId}
                    onClick={() =>
                      testSystemMail({
                        variables: { event: systemMail.event },
                      })
                    }
                  >
                    {t('systemMails.sendTest')}
                  </Button>
                </PermissionControl>
              </Controls>
            </EventRow>
          );
        })}
      </EventList>
    </MailBlock>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent(
  [CanGetSystemMails.id, CanUpdateSystemMails.id],
  false
)(SystemMailSection);
export { CheckedPermissionComponent as SystemMailSection };
