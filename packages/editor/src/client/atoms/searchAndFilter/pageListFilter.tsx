import CloseIcon from '@rsuite/icons/legacy/Close'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, DateRangePicker, Form, Input, Toggle} from 'rsuite'

import {DateFilterComparison, PageFilter} from '../../api'

export interface PageListFilterProps {
  filter: PageFilter
  isLoading: boolean
  onSetFilter(filter: PageFilter): void
}

export function PageListFilter({filter, onSetFilter}: PageListFilterProps) {
  const {t} = useTranslation()
  const [resetFilterKey, setResetFilterkey] = useState<string>(new Date().getTime().toString())

  const formInputStyle = {
    marginRight: '15px',
    marginTop: '0',
    marginBottom: '10px'
  }

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

  const updateFilter = (value: PageFilter) => {
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
      <>
        <Form.Group style={{marginRight: '15px', marginTop: '15px'}}>
          <Button onClick={() => resetFilter()} color="red" appearance="ghost">
            <CloseIcon style={{marginRight: '5px'}} />
            {t('articleList.filter.reset')}
          </Button>
        </Form.Group>
      </>
    )
  }

  return (
    <>
      <Form style={{display: 'flex', flexWrap: 'wrap', marginTop: '15px'}}>
        <Form.Group style={formInputStyle}>
          <Input
            value={filter.title || ''}
            placeholder={t('articleList.filter.title')}
            onChange={value => updateFilter({title: value})}
          />
        </Form.Group>
        <Form.Group style={formInputStyle}>
          <Input
            value={filter.description || ''}
            placeholder={t('articleList.filter.description')}
            onChange={value => updateFilter({description: value})}
          />
        </Form.Group>
        <Form.Group style={formInputStyle}>
          <Toggle
            style={{display: 'inline-block', marginTop: '6px'}}
            defaultChecked={!!filter.draft}
            onChange={value => updateFilter({draft: value || null})}
            checkedChildren={t('articleList.filter.isDraft')}
            unCheckedChildren={t('articleList.filter.isDraft')}
          />
        </Form.Group>
        <Form.Group style={formInputStyle}>
          <Toggle
            style={{display: 'inline-block', marginTop: '6px'}}
            defaultChecked={!!filter.published}
            onChange={value => updateFilter({published: value || null})}
            checkedChildren={t('articleList.filter.isPublished')}
            unCheckedChildren={t('articleList.filter.isPublished')}
          />
        </Form.Group>
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
      </Form>
      {resetFilterView()}
    </>
  )
}
