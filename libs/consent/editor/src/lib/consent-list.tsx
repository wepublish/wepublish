import {ApolloError} from '@apollo/client'
import {IconButton, Message, Table as RTable, toaster} from 'rsuite'
import {MdAdd, MdDelete} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import {Consent, useConsentsQuery, useDeleteConsentMutation} from '@wepublish/editor/api-v2'
import {RowDataType} from 'rsuite-table'
import {useMemo} from 'react'
import {getApiClientV2} from '../apiClientv2'

const {Column, HeaderCell, Cell} = RTable

// export function getApiClientV2() {
//   const apiURL = 'http://localhost:4000'
//   const link = new HttpLink({uri: `${apiURL}/v2`})
//   return new ApolloClient({
//     link,
//     cache: new InMemoryCache()
//   })
// }

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

/* eslint-disable-next-line */
export interface ConsentListProps {}

export function ConsentList(props: ConsentListProps) {
  const client = useMemo(() => getApiClientV2(), [])

  const {loading, data, refetch} = useConsentsQuery({
    client,
    fetchPolicy: 'no-cache',
    onError: onErrorToast
  })

  const [deleteConsent] = useDeleteConsentMutation({
    client,
    onError: onErrorToast,
    onCompleted: () => refetch()
  })

  const {t} = useTranslation()

  const onDeleteConsent = (id: string) => {
    deleteConsent({
      variables: {
        id
      }
    })
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('consents.title')}</h2>
        </ListViewHeader>
        {/* todo permission control */}
        {/* <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}> */}
        <ListViewActions>
          <Link to="/consents/create">
            <IconButton appearance="primary" disabled={loading} icon={<MdAdd />}>
              {t('consents.create')}
            </IconButton>
          </Link>
        </ListViewActions>
        {/* </PermissionControl> */}
      </ListViewContainer>

      <TableWrapper>
        <Table fillHeight loading={loading} data={data?.consents || []}>
          <Column width={200} resizable>
            <HeaderCell>{t('consents.name')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Consent>) => (
                <Link to={`/consents/edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </Cell>
          </Column>

          <Column width={200} resizable>
            <HeaderCell>{t('consents.slug')}</HeaderCell>
            <Cell>{(rowData: RowDataType<Consent>) => <span>{rowData.slug}</span>}</Cell>
          </Column>

          <Column width={200} resizable>
            <HeaderCell>{t('consents.defaultValue')}</HeaderCell>
            <Cell>{(rowData: RowDataType<Consent>) => <span>{rowData.defaultValue}</span>}</Cell>
          </Column>

          <Column resizable>
            <HeaderCell align={'center'}>{t('delete')}</HeaderCell>
            <Cell align={'center'} style={{padding: '5px 0'}}>
              {(rowData: RowDataType<Consent>) => (
                <IconButton
                  icon={<MdDelete />}
                  color="red"
                  appearance="ghost"
                  circle
                  size="sm"
                  onClick={() => onDeleteConsent(rowData.id)}
                />
              )}
            </Cell>
          </Column>
        </Table>
      </TableWrapper>
    </>
  )
}

export default ConsentList
