import React, {useEffect, useRef} from 'react'
import {Input, InputGroup} from 'rsuite'
import SearchIcon from '@rsuite/icons/legacy/Search'
import {useTranslation} from 'react-i18next'

export interface SubscriptionListSearchProps {
  onUpdateSearch(searchString: string | undefined): void
}

export function SubscriptionListSearch({onUpdateSearch}: SubscriptionListSearchProps) {
  const {t} = useTranslation()
  const lastSearch = useRef<string | undefined>(undefined)
  const currentSearch = useRef<string | undefined>(undefined)

  // do not perform search on each user input. rather wait for 2 seconds and if user input changed, perform search
  useEffect(() => {
    setInterval(() => {
      if (currentSearch.current !== lastSearch.current) {
        lastSearch.current = currentSearch.current
        onUpdateSearch(currentSearch.current)
      }
    }, 2000)
  }, [])

  return (
    <>
      <InputGroup inside>
        <Input
          placeholder={t('subscriptionList.search.inputPlaceholder')}
          onChange={newSearch => {
            currentSearch.current = newSearch
          }}
        />
        <InputGroup.Addon>
          <SearchIcon />
        </InputGroup.Addon>
      </InputGroup>
    </>
  )
}
