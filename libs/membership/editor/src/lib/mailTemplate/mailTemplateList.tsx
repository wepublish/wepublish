import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {useMailTemplateQuery, useSynchronizeMailTemplatesMutation} from '@wepublish/editor/api-v2'
import {ListViewContainer, ListViewHeader} from 'apps/editor/src/app/ui/listView'
import {getApiClientV2} from 'apps/editor/src/app/utility'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {MdCheck, MdSync, MdWarning} from 'react-icons/all'
import {Button, Stack} from 'rsuite'
import styles from './mailTemplate.module.css'
import {createCheckedPermissionComponent, PermissionControl} from 'app/atoms/permissionControl'
import {DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS} from '../common'

function MailTemplateList() {
  const {t} = useTranslation()

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const {data: queryData} = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS(client, t))

  const [syncTemplates, {loading: mutationLoading}] = useSynchronizeMailTemplatesMutation({
    ...DEFAULT_MUTATION_OPTIONS(client, t),
    refetchQueries: ['MailTemplate']
  })

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noreferrer')
  }

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('mailTemplates.availableTemplates')}</h2>
            <Typography variant="subtitle1">
              {t('mailTemplates.explanation', {provider: queryData?.provider.name})}
            </Typography>
          </ListViewHeader>
        </ListViewContainer>
        <PermissionControl
          showRejectionMessage={false}
          qualifyingPermissions={['CAN_SYNC_MAIL-TEMPLATES']}>
          <Button appearance="primary" onClick={() => syncTemplates()}>
            <MdSync className={mutationLoading ? styles.iconSpin : ''} />{' '}
            {t('mailTemplates.synchronize')}
          </Button>
        </PermissionControl>
      </Stack>

      <TableContainer style={{marginTop: '16px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>{t('mailTemplates.name')}</b>
              </TableCell>
              <TableCell>
                <b>{t('mailTemplates.description')}</b>
              </TableCell>
              <TableCell>
                <b>{t('mailTemplates.content')}</b>
              </TableCell>
              <TableCell>
                <b>{t('mailTemplates.status')}</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queryData &&
              queryData.mailTemplates.map(template => (
                <TableRow key={template.id.toString()}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    {template.remoteMissing ? (
                      ''
                    ) : (
                      <Button appearance="default" onClick={() => openInNewTab(template.url)}>
                        {t('mailTemplates.view', {provider: queryData?.provider.name})}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {template.status === 'ok' ? (
                      <MdCheck />
                    ) : (
                      <>
                        <MdWarning />{' '}
                        {t(`mailTemplates.statuses.${template.status}`, {
                          provider: queryData?.provider.name,
                          internalName: template.externalMailTemplateId
                        })}
                      </>
                    )}
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
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_SYNC_MAIL-TEMPLATES'
])(MailTemplateList)
export {CheckedPermissionComponent as MailTemplateList}
