import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  useSystemMailsQuery,
  useMailTemplateQuery,
  UserEvent,
  useTestSystemMailMutation,
  useUpdateSystemMailMutation,
  getApiClientV2,
} from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, SelectPicker, Stack, Tag } from 'rsuite';
import { TypeAttributes } from 'rsuite/esm/@types/common';
import { MdLink, MdLogin, MdPassword } from 'react-icons/md';
import { RiTestTubeLine } from 'react-icons/ri';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';

type UserEventColorMap = Record<
  (typeof UserEvent)[keyof typeof UserEvent],
  TypeAttributes.Color
>;
const userEventColors: UserEventColorMap = {
  [UserEvent.AccountCreation]: 'green',
  [UserEvent.PasswordReset]: 'blue',
  [UserEvent.LoginLink]: 'yellow',
  [UserEvent.TestMail]: 'violet',
};

type UserEventIconMap = Record<
  (typeof UserEvent)[keyof typeof UserEvent],
  JSX.Element
>;
const userEventIcons: UserEventIconMap = {
  [UserEvent.AccountCreation]: <MdLogin size={16} />,
  [UserEvent.PasswordReset]: <MdPassword size={16} />,
  [UserEvent.LoginLink]: <MdLink size={16} />,
  [UserEvent.TestMail]: <RiTestTubeLine size={16} />,
};

function SystemMailList() {
  const { t } = useTranslation();

  const client = useMemo(() => getApiClientV2(), []);
  const { data: systemMails } = useSystemMailsQuery(
    DEFAULT_QUERY_OPTIONS(client)
  );
  const { data: mailTemplates } = useMailTemplateQuery(
    DEFAULT_QUERY_OPTIONS(client)
  );
  const [updateSystemMail] = useUpdateSystemMailMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  );
  const [testSystemMail] = useTestSystemMailMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  );

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('systemMails.title')}</h2>
            <Typography variant="subtitle1">
              {t('systemMails.explanation')}
            </Typography>
          </ListViewHeader>
        </ListViewContainer>
      </Stack>

      <TableContainer style={{ marginTop: '16px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('systemMails.event')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('systemMails.template')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('systemMails.test')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {systemMails &&
              mailTemplates &&
              systemMails.systemMails.map(systemMail => (
                <TableRow key={systemMail.event}>
                  <TableCell>
                    <Tag color={userEventColors[systemMail.event]}>
                      {userEventIcons[systemMail.event]}{' '}
                      {t(
                        `systemMails.events.${systemMail.event.toLowerCase()}`
                      )}
                    </Tag>
                  </TableCell>

                  <TableCell>
                    <SelectPicker
                      style={{ width: '100%' }}
                      data={mailTemplates.mailTemplates.map(mailTemplate => ({
                        label: `${mailTemplate.remoteMissing ? '⚠' : ''} ${mailTemplate.name}`,
                        value: mailTemplate.id,
                      }))}
                      cleanable={false}
                      defaultValue={systemMail.mailTemplate?.id}
                      onSelect={(value: string) =>
                        updateSystemMail({
                          variables: {
                            event: systemMail.event,
                            mailTemplateId: value,
                          },
                        })
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      appearance="default"
                      onClick={() =>
                        testSystemMail({
                          variables: { event: systemMail.event },
                        })
                      }
                    >
                      {t('systemMails.test')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SYSTEM_MAILS',
  'CAN_UPDATE_SYSTEM_MAILS',
])(SystemMailList);
export { CheckedPermissionComponent as SystemMailList };
