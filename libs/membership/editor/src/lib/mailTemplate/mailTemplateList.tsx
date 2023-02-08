import {ApolloError} from '@apollo/client'
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
import {Button, Message, Stack, toaster} from 'rsuite'
import styles from './mailTemplate.module.css'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export function MailTemplateList() {
  const {t} = useTranslation()

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const {data: queryData} = useMailTemplateQuery({
    client,
    onError: showErrors
  })

  const [syncTemplates, {loading: mutationLoading}] = useSynchronizeMailTemplatesMutation({
    client,
    onError: showErrors,
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
        <Button appearance="primary" onClick={() => syncTemplates()}>
          <MdSync className={mutationLoading ? styles.iconSpin : ''} />{' '}
          {t('mailTemplates.synchronize')}
        </Button>
      </Stack>

      <TableContainer style={{marginTop: '16px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>{t('mailTemplates.name')}</b>
              </TableCell>
              <TableCell>
                <b>{t('mailTemplates.internalName')}</b>
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
                  <TableCell>{template.externalMailTemplateId}</TableCell>
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
                    {template.remoteMissing ? (
                      <>
                        <MdWarning />{' '}
                        {t('mailTemplates.statusDeleted', {provider: queryData?.provider.name})}
                      </>
                    ) : (
                      <MdCheck />
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
