import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdClose} from 'react-icons/md'
import {Button, DateRangePicker, Form, Input, SelectPicker, Toggle} from 'rsuite'

import {
  ArticleFilter,
  AuthorRefFragment,
  DateFilterComparison,
  PageFilter,
  usePeerListLazyQuery
} from '../../api'
import {AuthorCheckPicker} from '../../panel/authorCheckPicker'

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

export interface ListViewFiltersProps {
  fields: Field[]
  filter: Partial<ArticleFilter & PageFilter>
  isLoading: boolean
  onSetFilter(filter: ArticleFilter & PageFilter): void
  setPeerFilter?(value: string): void
}

export function ListViewFilters({
  fields,
  filter,
  onSetFilter,
  setPeerFilter
}: ListViewFiltersProps) {
  const {t} = useTranslation()
  const [resetFilterKey, setResetFilterkey] = useState<string>(new Date().getTime().toString())

  const isPeerFilter = fields.includes('peer') && !!setPeerFilter

  const [peerListFetch, {data: peerListData}] = usePeerListLazyQuery({
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (isPeerFilter) {
      peerListFetch()
    }
  }, [isPeerFilter])

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

  const updateFilter = (value: Partial<ArticleFilter & PageFilter>) => {
    if (value.authors && !value.authors.length) {
      value = {authors: null}
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
      return <></>
    }
    return (
      <Form.Group style={{width: '100%'}}>
          <Button onClick={() => resetFilter()} color="red" appearance="ghost">
            <MdClose style={{marginRight: '5px'}} />
            {t('articleList.filter.reset')}
          </Button>
        </Form.Group>
    )
  }

  const authorsData = filter?.authors?.map(author => ({id: author})) || []

  return (
    <>
      <Form style={{display: 'flex', flexWrap: 'wrap', marginTop: '15px'}}>
        {fields.includes('title') && (
          <Form.Group style={formInputStyle}>
            <Input
              value={filter.title || ''}
              placeholder={t('articleList.filter.title')}
              onChange={value => updateFilter({title: value})}
            />
          </Form.Group>
        )}

        {fields.includes('description') && (
          <Form.Group style={formInputStyle}>
            <Input
              value={filter.description || ''}
              placeholder={t('articleList.filter.description')}
              onChange={value => updateFilter({description: value})}
            />
          </Form.Group>
        )}

        {fields.includes('preTitle') && (
          <Form.Group style={formInputStyle}>
            <Input
              value={filter.preTitle || ''}
              placeholder={t('articleList.filter.preTitle')}
              onChange={value => updateFilter({preTitle: value})}
            />
          </Form.Group>
        )}

        {fields.includes('lead') && (
          <Form.Group style={formInputStyle}>
            <Input
              value={filter.lead || ''}
              placeholder={t('articleList.filter.lead')}
              onChange={value => updateFilter({lead: value})}
            />
          </Form.Group>
        )}

        {fields.includes('authors') && (
          <Form.Group style={formInputStyle}>
            <AuthorCheckPicker
              list={authorsData as AuthorRefFragment[]}
              onChange={value => {
                console.log('value123', value)
                return updateFilter({authors: value ? value.map(author => author.id) : []})
              }}
            />
          </Form.Group>
        )}

        {fields.includes('draft') && (
          <Form.Group style={formInputStyle}>
            <Toggle
              style={{display: 'inline-block', marginTop: '6px'}}
              defaultChecked={!!filter.draft}
              onChange={value => updateFilter({draft: value || null})}
              checkedChildren={t('articleList.filter.isDraft')}
              unCheckedChildren={t('articleList.filter.isDraft')}
            />
          </Form.Group>
        )}

        {fields.includes('pending') && (
          <Form.Group style={formInputStyle}>
            <Toggle
              style={{display: 'inline-block', marginTop: '6px'}}
              defaultChecked={!!filter.pending}
              onChange={value => updateFilter({pending: value || null})}
              checkedChildren={t('articleList.filter.isPending')}
              unCheckedChildren={t('articleList.filter.isPending')}
            />
          </Form.Group>
        )}

        {fields.includes('published') && (
          <Form.Group style={formInputStyle}>
            <Toggle
              style={{display: 'inline-block', marginTop: '6px'}}
              defaultChecked={!!filter.published}
              onChange={value => updateFilter({published: value || null})}
              checkedChildren={t('articleList.filter.isPublished')}
              unCheckedChildren={t('articleList.filter.isPublished')}
            />
          </Form.Group>
        )}

        {fields.includes('publicationDate') && (
          <Form.Group style={formInputStyle}>
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
          </Form.Group>
        )}

        {isPeerFilter && !!allPeers && (
          <Form.Group style={formInputStyle}>
            <SelectPicker
              virtualized
              data={allPeers.map(peer => ({
                value: peer.name,
                label: peer.profile?.name
              }))}
              style={{width: 150}}
              placeholder={t('peerArticles.filterByPeer')}
              searchable
              onSelect={value => setPeerFilter(value)}
              onClean={() => setPeerFilter('')}
            />
          </Form.Group>
        )}
      </Form>
      {resetFilterView()}
    </>
  )
}
