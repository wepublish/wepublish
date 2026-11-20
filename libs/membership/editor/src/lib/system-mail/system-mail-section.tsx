import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  MailTemplateDocument,
  SystemMailsDocument,
  SystemMailsQuery,
  TestSystemMailDocument,
  UpdateSystemMailDocument,
  UserEvent,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DataTable,
  DataTableColumn,
  PermissionControl,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiTestTubeLine } from 'react-icons/ri';
import {
  DEFAULT_MUTATION_OPTIONS,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
} from '../common';
import { InfoTooltip } from '../mail-settings-layout';
import { purposeOfEvent } from '../mail-template/event-purpose';
import { MailTemplateField } from '../mail-template/mail-template-field';
import { Button, Typography } from '@mui/material';
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
  UserEvent.EmailChange,
  UserEvent.EmailVerification,
  // Only people working in the editor can ask for it.
  UserEvent.PasswordReset,
  UserEvent.TestMail,
];

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const Heading = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

// At most three lines, then cut off; the title holds the whole text.
const UserAction = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  white-space: normal;
`;

const EventName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  font-weight: 600;
`;

type SystemMail = SystemMailsQuery['systemMails'][number];

function SystemMailSection() {
  const { t } = useTranslation();
  const headingId = useId();

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

  const columns: DataTableColumn<SystemMail>[] = [
    {
      id: 'event',
      label: t('systemMails.columns.event'),
      width: 190,
      render: systemMail => {
        const eventKey = systemMail.event.toLowerCase();

        return (
          <EventName>
            {t(`systemMails.events.${eventKey}`)}

            <InfoTooltip
              description={t(`systemMails.eventInfo.${eventKey}.description`)}
              example={t(`systemMails.eventInfo.${eventKey}.example`)}
            />
          </EventName>
        );
      },
    },
    {
      id: 'userAction',
      label: t('systemMails.columns.userAction'),
      // The column that gives way when the window gets narrow: the template
      // select and the test button keep their width, this text wraps.
      width: 200,
      render: systemMail => {
        const userAction = t(
          `systemMails.eventInfo.${systemMail.event.toLowerCase()}.userAction`
        );

        return <UserAction title={userAction}>{userAction}</UserAction>;
      },
    },
    {
      id: 'template',
      label: t('systemMails.columns.template'),
      width: 320,
      render: systemMail => (
        <MailTemplateField
          value={assignedTemplateId(
            systemMail.event,
            systemMail.mailTemplate?.id
          )}
          templates={mailTemplates?.mailTemplates ?? []}
          purpose={purposeOfEvent(systemMail.event)}
          label={t(`systemMails.events.${systemMail.event.toLowerCase()}`)}
          disabled={!canUpdateSystemMails}
          onChange={id => assignTemplate(systemMail.event, id)}
        />
      ),
    },
    {
      id: 'action',
      label: t('action'),
      width: 220,
      fixed: true,
      render: systemMail => (
        <PermissionControl
          showRejectionMessage={false}
          qualifyingPermissions={[CanTestSystemMails.id]}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<RiTestTubeLine />}
            disabled={
              !assignedTemplateId(systemMail.event, systemMail.mailTemplate?.id)
            }
            onClick={() =>
              testSystemMail({ variables: { event: systemMail.event } })
            }
          >
            {t('systemMails.sendTest')}
          </Button>
        </PermissionControl>
      ),
    },
  ];

  return (
    <Section aria-labelledby={headingId}>
      <Heading>
        <Typography
          id={headingId}
          variant="h5"
          component="h2"
        >
          {t('systemMails.title')}
        </Typography>

        <InfoTooltip
          description={t('systemMails.sectionDescription')}
          example={t('systemMails.sectionExample')}
        />
      </Heading>

      <DataTable
        data={events}
        getRowId={systemMail => systemMail.event}
        columns={columns}
      />
    </Section>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent(
  [CanGetSystemMails.id, CanUpdateSystemMails.id],
  false
)(SystemMailSection);
export { CheckedPermissionComponent as SystemMailSection };
