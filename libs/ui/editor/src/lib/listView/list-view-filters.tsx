import styled from '@emotion/styled'
import {
  ArticleFilter,
  AuthorRefFragment,
  DateFilterComparison,
  EventFilter,
  FullUserRoleFragment,
  PageFilter,
  usePeerListLazyQuery,
  UserFilter,
  useUserRoleListLazyQuery
} from '@wepublish/editor/api'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdClose} from 'react-icons/md'
import {
  Button,
  CheckPicker as RCheckPicker,
  DateRangePicker,
  Form as RForm,
  Input,
  SelectPicker as RSelectPicker,
  Toggle as RToggle
} from 'rsuite'

import {AuthorCheckPicker} from '../panel/authorCheckPicker'
import {InputMaybe, Scalars, useEventProvidersLazyQuery} from '@wepublish/editor/api-v2'
import {getApiClientV2} from '@wepublish/editor/api-v2'

const {Group} = RForm

const Form = styled(RForm)`
  display: flex;
  flex-wrap: wrap;
  margin-top: 15px;
`

const CloseIcon = styled(MdClose)`
  margin-right: 5px;
`

const SelectPicker = styled(RSelectPicker)`
  width: 150px;
`

const CheckPicker = styled(RCheckPicker)`
  width: 200px;
`

const Toggle = styled(RToggle)`
  display: inline-block;
  margin-top: 6px;
`

const FormGroup = styled(Group)`
  width: 100%;
`

const WideInput = styled(Input)`
  width: 400px;
`

const formInputStyle = {
  marginRight: '15px',
  marginTop: '0',
  marginBottom: '10px'
}

type Field =
  | 'title'
  | 'preTitle'
  | 'lead'
  | 'description'
  | 'draft'
  | 'published'
  | 'pending'
  | 'authors'
  | 'peer'
  | 'publicationDate'
  | 'dates'
  | 'providers'
  | 'userRole'
  | 'text'
  | 'name'
  | 'location'
  | 'includeHidden'

export type ImportableEventFilter = {
  startsAt?: InputMaybe<Scalars['String']>
  endsAt?: InputMaybe<Scalars['String']>
  providers?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

type Filter = ArticleFilter & PageFilter & UserFilter & EventFilter & ImportableEventFilter

export interface ListViewFiltersProps {
  fields: Field[]
  filter: Partial<Filter>
  isLoading: boolean
  onSetFilter(filter: Filter): void
  className?: string

  // optional setters for filters
  setPeerFilter?(value: string): void
}

export function ListViewFilters({
  fields,
  filter,
  onSetFilter,
  setPeerFilter,
  className
}: ListViewFiltersProps) {
  const client = useMemo(() => getApiClientV2(), [])
  const {t} = useTranslation()
  const [resetFilterKey, setResetFilterkey] = useState<string>(new Date().getTime().toString())
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])

  const [providersFetch, {data: providersData}] = useEventProvidersLazyQuery({
    client,
    fetchPolicy: 'network-only'
  })

  const [userRoleFetch, {data: userRoleData}] = useUserRoleListLazyQuery({
    fetchPolicy: 'network-only',
    variables: {
      take: 200
    }
  })

  const [peerListFetch, {data: peerListData}] = usePeerListLazyQuery({
    fetchPolicy: 'network-only'
  })

  // check whether or not we need to get some data based on which filters are required
  const isProviderFilter = fields.includes('providers')
  const isUserRoleFilter = fields.includes('userRole')
  const isPeerFilter = fields.includes('peer') && !!setPeerFilter

  // conditionally get some additional data
  useEffect(() => {
    if (isPeerFilter) {
      peerListFetch()
    }
  }, [isPeerFilter, peerListFetch])

  useEffect(() => {
    if (isUserRoleFilter) {
      userRoleFetch()
    }
  }, [isUserRoleFilter, userRoleFetch])

  useEffect(() => {
    if (isProviderFilter) {
      providersFetch()
    }
  }, [isProviderFilter, providersFetch])

  /**
   * Setup user roles, whenever user role data object changes
   */
  useEffect(() => {
    if (userRoleData?.userRoles?.nodes) {
      setUserRoles(userRoleData.userRoles.nodes)
    }
  }, [userRoleData?.userRoles])

  const allPeers = peerListData?.peers

  /**
   * helper functions to manage filter
   */
  function isAnyFilterSet(): boolean {
    for (const [filterKey, filterValue] of Object.entries(filter)) {
      if (filterKey && filterValue) return true
    }

    return false
  }

  function resetFilter(): void {
    onSetFilter({})
    setResetFilterkey(new Date().getTime().toString())
  }

  const updateFilter = (value: Partial<Filter>) => {
    if (value.authors && !value.authors.length) {
      value = {authors: null}
    }
    if (value.userRole && !value.userRole.length) {
      value = {userRole: null}
    }

    const newFilter = {
      ...filter,
      ...value
    }
    onSetFilter(newFilter)
  }

  /**
   * UI helper functions
   */
  function resetFilterView() {
    if (!isAnyFilterSet()) {
      return null
    }

    return (
      <FormGroup>
        <Button onClick={() => resetFilter()} color="red" appearance="ghost">
          <CloseIcon />
          {t('articleList.filter.reset')}
        </Button>
      </FormGroup>
    )
  }

  const authorsData = filter?.authors?.map(author => ({id: author})) || []
  return (
    <>
      <Form className={className}>
        {fields.includes('text') && (
          <Group style={formInputStyle}>
            <WideInput
              value={filter.text || ''}
              placeholder={t('subscriptionList.filter.searchPlaceholder')}
              onChange={value => updateFilter({text: value})}
            />
          </Group>
        )}

        {fields.includes('userRole') && (
          <Group style={formInputStyle}>
            <CheckPicker
              data-testid="userRole-combobox"
              name="userRoles"
              block
              value={filter?.userRole || []}
              data={userRoles.map(userRole => ({
                value: userRole.id,
                label: userRole.name
              }))}
              placement="auto"
              onChange={value => {
                updateFilter({
                  userRole:
                    userRoles.filter(userRole => value.includes(userRole.id)).map(r => r.id) || null
                })
              }}
              onClean={() => {
                onSetFilter({userRole: []})
              }}
              placeholder={t('userCreateOrEditView.userRoles')}
            />
          </Group>
        )}

        {fields.includes('title') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.title || ''}
              placeholder={t('articleList.filter.title')}
              onChange={value => updateFilter({title: value})}
            />
          </Group>
        )}

        {fields.includes('description') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.description || ''}
              placeholder={t('articleList.filter.description')}
              onChange={value => updateFilter({description: value})}
            />
          </Group>
        )}

        {fields.includes('preTitle') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.preTitle || ''}
              placeholder={t('articleList.filter.preTitle')}
              onChange={value => updateFilter({preTitle: value})}
            />
          </Group>
        )}

        {fields.includes('lead') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.lead || ''}
              placeholder={t('articleList.filter.lead')}
              onChange={value => updateFilter({lead: value})}
            />
          </Group>
        )}

        {fields.includes('name') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.name || ''}
              placeholder={t('articleList.filter.name')}
              onChange={value => updateFilter({name: value})}
            />
          </Group>
        )}

        {fields.includes('location') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.location || ''}
              placeholder={t('articleList.filter.location')}
              onChange={value => updateFilter({location: value})}
            />
          </Group>
        )}

        {fields.includes('authors') && (
          <Group style={formInputStyle}>
            <AuthorCheckPicker
              list={authorsData as AuthorRefFragment[]}
              onChange={value => {
                return updateFilter({authors: value ? value.map(author => author.id) : []})
              }}
            />
          </Group>
        )}

        {fields.includes('providers') && (
          <Group style={formInputStyle}>
            <CheckPicker
              disabled={false}
              searchable={false}
              virtualized
              cleanable
              value={filter.providers || []}
              data={
                providersData
                  ? providersData?.eventProviders.map(provider => ({
                      value: provider,
                      label: provider
                    }))
                  : [{value: undefined, label: undefined}]
              }
              placeholder={t('articleList.filter.providers')}
              onChange={providers => {
                updateFilter({
                  providers: providers.length
                    ? (providers.filter(p => p !== '') as string[])
                    : undefined
                })
              }}
              block
            />
          </Group>
        )}

        {fields.includes('draft') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.draft}
              onChange={value => updateFilter({draft: value || null})}
              checkedChildren={t('articleList.filter.isDraft')}
              unCheckedChildren={t('articleList.filter.isDraft')}
            />
          </Group>
        )}

        {fields.includes('pending') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.pending}
              onChange={value => updateFilter({pending: value || null})}
              checkedChildren={t('articleList.filter.isPending')}
              unCheckedChildren={t('articleList.filter.isPending')}
            />
          </Group>
        )}

        {fields.includes('published') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.published}
              onChange={value => updateFilter({published: value || null})}
              checkedChildren={t('articleList.filter.isPublished')}
              unCheckedChildren={t('articleList.filter.isPublished')}
            />
          </Group>
        )}

        {fields.includes('publicationDate') && (
          <Group style={formInputStyle}>
            <DateRangePicker
              key={`publication-date-${resetFilterKey}`}
              placeholder={t('articleList.filter.publicationDate')}
              block
              placement="auto"
              onChange={value => {
                if (value && value[0] && value[1]) {
                  updateFilter({
                    publicationDateFrom: {
                      date: value[0]?.toISOString(),
                      comparison: DateFilterComparison.Greater
                    },
                    publicationDateTo: {
                      date: value[1]?.toISOString(),
                      comparison: DateFilterComparison.Lower
                    }
                  })
                }
              }}
              onClean={() =>
                updateFilter({publicationDateFrom: undefined, publicationDateTo: undefined})
              }
            />
          </Group>
        )}

        {fields.includes('dates') && (
          <Group style={formInputStyle}>
            <DateRangePicker
              key={`dates-${resetFilterKey}`}
              placeholder={t('articleList.filter.dates')}
              block
              placement="auto"
              onChange={value => {
                if (value && value[0] && value[1]) {
                  updateFilter({
                    from: value[0]?.toISOString(),
                    to: value[1]?.toISOString()
                  })
                }
              }}
              onClean={() => updateFilter({from: undefined, to: undefined})}
            />
          </Group>
        )}

        {isPeerFilter && !!allPeers && (
          <Group style={formInputStyle}>
            <SelectPicker
              virtualized
              data={allPeers.map(peer => ({
                value: peer.name,
                label: peer.profile?.name
              }))}
              placeholder={t('peerArticles.filterByPeer')}
              searchable
              onSelect={value => setPeerFilter(value)}
              onClean={() => setPeerFilter('')}
            />
          </Group>
        )}

        {fields.includes('includeHidden') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.includeHidden}
              onChange={value => updateFilter({includeHidden: value || null})}
              checkedChildren={t('articleList.filter.includeHidden')}
              unCheckedChildren={t('articleList.filter.includeHidden')}
            />
          </Group>
        )}
      </Form>
      {resetFilterView()}
    </>
  )
}
