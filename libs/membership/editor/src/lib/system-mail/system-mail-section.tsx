import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  MailChannel,
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
import { MdUnsubscribe } from 'react-icons/md';
import { RiTestTubeLine } from 'react-icons/ri';
import {
  DEFAULT_MUTATION_OPTIONS,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
} from '../common';
import { InfoTooltip } from '../mail-settings-layout';
import { formatTemplateLabel } from '../mail-template/mail-placeholders';
import { templatesForChannel } from '../mail-template/template-versions';
import { Button, MenuItem, TextField, Typography } from '@mui/material';
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

  const templateOptions = useMemo(
    () =>
      // A system mail answers a request at once and is never printed.
      templatesForChannel(
        mailTemplates?.mailTemplates || [],
        MailChannel.Mail
      ).map(mailTemplate => ({
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

  const columns: DataTableColumn<SystemMail>[] = [
    {
      id: 'event',
      label: t('systemMails.columns.event'),
      width: 240,
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
      width: 420,
      render: systemMail =>
        t(`systemMails.eventInfo.${systemMail.event.toLowerCase()}.userAction`),
    },
    {
      id: 'template',
      label: t('systemMails.columns.template'),
      width: 320,
      render: systemMail => (
        <TextField
          select
          size="small"
          disabled={!canUpdateSystemMails}
          value={systemMail.mailTemplate?.id ?? ''}
          onChange={event =>
            assignTemplate(systemMail.event, event.target.value || null)
          }
          slotProps={{
            select: {
              displayEmpty: true,
              SelectDisplayProps: {
                'aria-label': t(
                  `systemMails.events.${systemMail.event.toLowerCase()}`
                ),
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
      ),
    },
    {
      id: 'action',
      label: t('action'),
      width: 190,
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
