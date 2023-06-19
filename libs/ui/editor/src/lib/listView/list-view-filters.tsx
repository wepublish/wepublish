import styled from '@emotion/styled'
import {
  ArticleFilter,
  AuthorRefFragment,
  DateFilterComparison,
  FullUserRoleFragment,
  PageFilter,
  usePeerListLazyQuery,
  UserFilter,
  useUserRoleListLazyQuery
} from '@wepublish/editor/api'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdClose} from 'react-icons/md'
import {
  Button,
  CheckPicker,
  DateRangePicker,
  Form as RForm,
  Input,
  SelectPicker as RSelectPicker,
  Toggle as RToggle
} from 'rsuite'

import {AuthorCheckPicker} from '../panel/authorCheckPicker'

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
  | 'userRole'
  | 'text'

export interface ListViewFiltersProps {
  fields: Field[]
  filter: Partial<ArticleFilter & PageFilter & UserFilter>
  isLoading: boolean
  onSetFilter(filter: ArticleFilter & PageFilter & UserFilter): void
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
  const {t} = useTranslation()
  const [resetFilterKey, setResetFilterkey] = useState<string>(new Date().getTime().toString())
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])
  const isUserRoleFilter = fields.includes('userRole')

  const [userRoleFetch, {data: userRoleData}] = useUserRoleListLazyQuery({
    fetchPolicy: 'network-only',
    variables: {
      take: 200
    }
  })

  const isPeerFilter = fields.includes('peer') && !!setPeerFilter

  const [peerListFetch, {data: peerListData}] = usePeerListLazyQuery({
    fetchPolicy: 'network-only'
  })

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

  const updateFilter = (value: Partial<ArticleFilter & PageFilter & UserFilter>) => {
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
      </Form>
      {resetFilterView()}
    </>
  )
}
