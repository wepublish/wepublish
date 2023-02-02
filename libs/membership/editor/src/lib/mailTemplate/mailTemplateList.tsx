import {ApolloError} from '@apollo/client'
import {cssRule} from '@karma.run/react'
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
import {MdSync, MdTune, MdWarning} from 'react-icons/all'
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

  const [syncTemplates, {data: mutationData, loading: mutationLoading}] =
    useSynchronizeMailTemplatesMutation({
      client,
      onError: showErrors
    })

  return (
    <>
      <Stack>
        <ListViewContainer>
          <ListViewHeader>
            <h2>
              <MdTune /> Verfügbare E-Mail-Templates
            </h2>
            <Typography variant="subtitle1">
              Du kannst diese Einstellungen für jeden Memberplan überschreiben.
            </Typography>
          </ListViewHeader>
        </ListViewContainer>
        <Button appearance="primary" onClick={syncTemplates}>
          <MdSync className={mutationLoading ? styles.iconSpin : ''} /> Synchronisieren
        </Button>
      </Stack>

      <TableContainer style={{marginTop: '16px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Name</b>
              </TableCell>
              <TableCell>
                <b>Identifizierung</b>
              </TableCell>
              <TableCell>
                <b>Beschreibung</b>
              </TableCell>
              <TableCell>
                <b>Mitteilungen</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queryData &&
              queryData.mailTemplates.map(template => (
                <TableRow>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.externalMailTemplateId}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.remoteMissing ? <MdWarning /> : ''}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
