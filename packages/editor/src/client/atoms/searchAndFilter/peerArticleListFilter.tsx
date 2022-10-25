import CloseIcon from '@rsuite/icons/legacy/Close'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, DateRangePicker, Form, Input, SelectPicker} from 'rsuite'

import {
  ArticleFilter,
  DateFilterComparison,
  PeerWithProfileFragment,
  usePeerListQuery
} from '../../api'

export interface PeerArticleListFilterProps {
  filter: ArticleFilter
  isLoading: boolean
  onSetFilter(filter: ArticleFilter): void
  setPeerFilter(value: string): void
}

export function PeerArticleListFilter({
  filter,
  onSetFilter,
  setPeerFilter
}: PeerArticleListFilterProps) {
  const {t} = useTranslation()
  const [allPeers, setAllPeers] = useState<PeerWithProfileFragment[]>([])
  const [resetFilterKey, setResetFilterkey] = useState<string>(new Date().getTime().toString())

  const formInputStyle = {
    marginRight: '15px',
    marginTop: '0',
    marginBottom: '10px'
  }

  // fetch all peers
  const {data: peerListData} = usePeerListQuery({
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (peerListData?.peers) {
      setAllPeers(peerListData.peers)
    }
  }, [peerListData?.peers])

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

  const updateFilter = (value: ArticleFilter) => {
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
            value={filter.preTitle || ''}
            placeholder={t('articleList.filter.preTitle')}
            onChange={value => updateFilter({preTitle: value})}
          />
        </Form.Group>
        <Form.Group style={formInputStyle}>
          <Input
            value={filter.lead || ''}
            placeholder={t('articleList.filter.lead')}
            onChange={value => updateFilter({lead: value})}
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
      </Form>
      {resetFilterView()}
    </>
  )
}
