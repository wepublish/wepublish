import {ApolloClient, HttpLink, InMemoryCache} from '@apollo/client'
import styled from '@emotion/styled'
// import {Button} from '@wepublish/ui/editor'
import {Button, IconButton, Message, Modal, Pagination, Table as RTable} from 'rsuite'
import {MdAdd, MdComment, MdContentCopy, MdDelete, MdPreview, MdUnpublished} from 'react-icons/md'
import {Link, useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import {
  ConsentValue,
  useUserConsentsQuery,
  useCreateUserConsentMutation,
  useDeleteUserConsentMutation
} from '@wepublish/editor/api-v2'
import {RowDataType} from 'rsuite-table'
// import {getApiClientV2} from '../../../../../apps/editor/src/app/utility'
import {useEffect, useMemo, useState} from 'react'

const {Column, HeaderCell, Cell} = RTable

function getApiClientV2() {
  const apiURL = 'http://localhost:4000'
  const link = new HttpLink({uri: `${apiURL}/v2`})
  return new ApolloClient({
    link,
    cache: new InMemoryCache()
  })
}

/* eslint-disable-next-line */
export interface UserConsentListProps {}

export function UserConsentList(props: ConsentListProps) {
  const client = useMemo(() => getApiClientV2(), [])

  const [consentName, setConsentName] = useState('')
  const [consentSlug, setConsentSlug] = useState('')
  const [consentDefaultValue, setConsentDefaultValue] = useState<ConsentValue>(
    ConsentValue.Accepted
  )

  const [createUserConsent] = useCreateUserConsentMutation({client})
  const [deleteUserConsent] = useDeleteUserConsentMutation({client})

  const {error, data, refetch, loading} = useUserConsentsQuery({client})
  const {t} = useTranslation()

  const addConsent = async () => {
    const {data: newConsentData, errors} = await createUserConsent({
      variables: {
        consent: {
          name: consentName,
          slug: consentSlug,
          defaultValue: consentDefaultValue
        }
      }
    })
    console.log('errors', errors)
    console.log('newConsentData', newConsentData)
    refetch()
  }

  const onDeleteConsent = async id => {
    const {data: deleteConsentData} = await createUserConsent({
      variables: {
        id
      }
    })
    console.log('deleteConsentData', deleteConsentData)
    refetch()
  }

  console.log('data', data)
  console.log('error', error)
  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('articles.overview.articles')}</h2>
        </ListViewHeader>
        {/* <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}> */}
        <ListViewActions>
          <Link to="/articles/create">
            <IconButton appearance="primary" disabled={loading} icon={<MdAdd />}>
              {t('articles.overview.newArticle')}
            </IconButton>
          </Link>
        </ListViewActions>
        {/* </PermissionControl> */}

        {/* <ListFilters
          fields={[
            'title',
            'preTitle',
            'lead',
            'draft',
            'authors',
            'pending',
            'published',
            'publicationDate'
          ]}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => setFilter(filter)}
        /> */}
      </ListViewContainer>

      <form onSubmit={addConsent}>
        <label>
          Consent Name
          <input
            type="text"
            name="name"
            value={consentName}
            onChange={e => setConsentName(e.target.value)}
          />
        </label>
        <label>
          Consent Slug
          <input
            type="text"
            name="slug"
            value={consentSlug}
            onChange={e => setConsentSlug(e.target.value)}
          />
        </label>
        <label>
          Consent Default Value
          <select
            name="defaultValue"
            value={consentDefaultValue}
            onChange={e => setConsentDefaultValue(e.target.value as ConsentValue)}>
            <option value={ConsentValue.Accepted}>{ConsentValue.Accepted}</option>
            <option value={ConsentValue.Rejected}>{ConsentValue.Rejected}</option>
            <option value={ConsentValue.Unset}>{ConsentValue.Unset}</option>
          </select>
        </label>

        <button
          type="submit"
          onClick={e => {
            e.preventDefault()
            addConsent()
          }}>
          Submit
        </button>
      </form>

      <div style={{display: 'flex', flexDirection: 'column', marginTop: '2rem'}}>
        {data?.userConsents.map(c => (
          <div>
            Name: {c.name} Slug: {c.slug} Default Value: {c.defaultValue}
            <button onClick={() => onDeleteConsent(c.id)}>delete</button>
          </div>
        ))}
      </div>

      <TableWrapper>
        <Table fillHeight loading={loading} data={data?.userConsents || []}>
          <Column width={200} resizable>
            <HeaderCell>{t('event.list.name')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </Cell>
          </Column>

          <Column width={200} resizable>
            <HeaderCell>{t('event.list.slug')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                // <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
                <span>{rowData.slug}</span>
              )}
            </Cell>
          </Column>

          <Column width={200} resizable>
            <HeaderCell>{t('event.list.defaultValue')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                // <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
                <span>{rowData.defaultValue}</span>
              )}
            </Cell>
          </Column>

          {/* <Column width={250} resizable>
            <HeaderCell>{t('event.list.startsAt')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventStartsAtView startsAt={rowData.startsAt} />}
            </Cell>
          </Column> */}

          {/* <Column width={250} resizable>
            <HeaderCell>{t('event.list.endsAt')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventEndsAtView endsAt={rowData.endsAt} />}
            </Cell>
          </Column> */}

          <Column resizable>
            <HeaderCell align={'center'}>{t('event.list.delete')}</HeaderCell>
            <Cell align={'center'} style={{padding: '5px 0'}}>
              {(rowData: RowDataType<Event>) => (
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

export default UserConsentList
