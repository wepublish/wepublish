import styled from '@emotion/styled';
import {
  Table,
  TableBody,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  useMailTemplateQuery,
  UserEvent,
  useSystemMailsQuery,
  useTestSystemMailMutation,
  useUpdateSystemMailMutation,
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
import { Button, SelectPicker } from 'rsuite';
import {
  DEFAULT_MUTATION_OPTIONS,
  DEFAULT_QUERY_OPTIONS,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
} from '../common';
import {
  EventHeadCell,
  EventTableCell,
  SectionBandCell,
} from '../mail-settings-layout';
import { formatTemplateLabel } from '../mail-template/mail-placeholders';

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

const HeadRow = styled(TableRow)`
  .${tableCellClasses.head} {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

const CellStack = styled('div')`
  display: grid;
  gap: 6px;
  justify-items: stretch;
`;

function SystemMailSection() {
  const { t } = useTranslation();

  const { data: systemMails } = useSystemMailsQuery(DEFAULT_QUERY_OPTIONS());
  const { data: mailTemplates } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const [updateSystemMail] = useUpdateSystemMailMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [testSystemMail] = useTestSystemMailMutation(
    MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('systemMails.testSent'))
  );

  const canUpdateSystemMails = useAuthorisation('CAN_UPDATE_SYSTEM_MAILS');

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
    <TableContainer
      style={{ marginTop: '16px', marginBottom: '40px', maxWidth: '100%' }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <SectionBandCell
              colSpan={events.length}
              label={t('systemMails.title')}
              icon={<MdManageAccounts size={20} />}
              description={t('systemMails.sectionDescription')}
              example={t('systemMails.sectionExample')}
            />
          </TableRow>

          <HeadRow>
            {events.map(({ event }) => {
              const eventKey = event.toLowerCase();

              return (
                <EventTableCell
                  key={event}
                  align="center"
                >
                  <EventHeadCell
                    title={t(`systemMails.events.${eventKey}`)}
                    hint={t(`systemMails.eventInfo.${eventKey}.short`)}
                    description={t(
                      `systemMails.eventInfo.${eventKey}.description`
                    )}
                    example={t(`systemMails.eventInfo.${eventKey}.example`)}
                  />
                </EventTableCell>
              );
            })}
          </HeadRow>
        </TableHead>

        <TableBody>
          <TableRow>
            {events.map(systemMail => {
              const mailTemplateId = assignedTemplateId(
                systemMail.event,
                systemMail.mailTemplate?.id
              );

              return (
                <EventTableCell
                  key={systemMail.event}
                  align="center"
                >
                  <CellStack>
                    <SelectPicker
                      style={{ width: '100%' }}
                      data={templateOptions}
                      cleanable
                      disabled={!canUpdateSystemMails}
                      placeholder={
                        <>
                          <MdUnsubscribe
                            size={16}
                            style={{ marginRight: '5px' }}
                          />
                          {t('mailTemplateSelect.noMailSentSelectNow')}
                        </>
                      }
                      defaultValue={systemMail.mailTemplate?.id}
                      onSelect={(value: string) =>
                        assignTemplate(systemMail.event, value)
                      }
                      onClean={() => assignTemplate(systemMail.event, null)}
                    />

                    <PermissionControl
                      showRejectionMessage={false}
                      qualifyingPermissions={['CAN_TEST_SYSTEM_MAILS']}
                    >
                      <Button
                        size="sm"
                        appearance="ghost"
                        disabled={!mailTemplateId}
                        onClick={() =>
                          testSystemMail({
                            variables: { event: systemMail.event },
                          })
                        }
                      >
                        <RiTestTubeLine style={{ marginRight: '4px' }} />
                        {t('systemMails.sendTest')}
                      </Button>
                    </PermissionControl>
                  </CellStack>
                </EventTableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent(
  ['CAN_GET_SYSTEM_MAILS', 'CAN_UPDATE_SYSTEM_MAILS'],
  false
)(SystemMailSection);
export { CheckedPermissionComponent as SystemMailSection };
