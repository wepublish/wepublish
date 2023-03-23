import {ApolloError} from '@apollo/client'
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material'
import {useGetSystemMailsQuery} from '@wepublish/editor/api-v2'
import {ListViewContainer, ListViewHeader} from 'apps/editor/src/app/ui/listView'
import {getApiClientV2} from 'apps/editor/src/app/utility'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Message, Stack, toaster} from 'rsuite'
import {createCheckedPermissionComponent, PermissionControl} from 'app/atoms/permissionControl'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

function SystemMailList() {
  const {t} = useTranslation()

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const {data: queryData} = useGetSystemMailsQuery({
    client,
    onError: showErrors
  })

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('systemMails.title')}</h2>
            {/*<Typography variant="subtitle1">
              {t('mailTemplates.explanation', {provider: queryData?.provider.name})}
            </Typography>*/}
          </ListViewHeader>
        </ListViewContainer>
      </Stack>

      <TableContainer style={{marginTop: '16px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>{t('systemMails.event')}</b>
              </TableCell>
              <TableCell>
                <b>{t('systemMails.template')}</b>
              </TableCell>
              <TableCell>
                <b>{t('systemMails.test')}</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queryData &&
              queryData.getSystemMails.map(systemMail => (
                <TableRow key={systemMail.event}>
                  <TableCell>{systemMail.event}</TableCell>
                  <TableCell>
                    {/*<MailTemplateSelect mailTemplates={[]} event={SubscriptionEvent.Custom} />*/}
                  </TableCell>
                  <TableCell>
                    <Button appearance="default" onClick={() => alert(systemMail.event)}>
                      {t('systemMails.test')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SYSTEM_MAILS',
  'CAN_UPDATE_SYSTEM_MAILS'
])(SystemMailList)
export {CheckedPermissionComponent as SystemMailList}
