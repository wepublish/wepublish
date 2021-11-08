import React, {useState, useEffect} from 'react'
import {SelectPicker} from 'rsuite'
import {useTranslation} from 'react-i18next'

import {useAuthorListQuery, AuthorRefFragment} from '../api'

export interface AuthorSelectPickerProps {
  onChange: (value: string) => void
}

export function AuthorSelectPicker({onChange}: AuthorSelectPickerProps) {
  const [authors, setAuthors] = useState<AuthorRefFragment[]>([])
  const [authorsFilter, setAuthorsFilter] = useState('')
  const {t} = useTranslation()

  const authorsVariables = {filter: authorsFilter || undefined, first: 10}
  const {data} = useAuthorListQuery({
    variables: authorsVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (data?.authors?.nodes) {
      // console.log(data.authors.nodes);
      setAuthors(data.authors.nodes)
    }
  }, [data?.authors])

  return (
    <SelectPicker
      size="md"
      placeholder={t('Select Author')}
      block
      // value={authors.map(author => author.id)}
      data={authors.map(author => ({value: author.id, label: author.name}))}
      onChange={() => {
        const [value] = authors.map(author => author.id)
        onChange(value)
      }}
    />
  )
}
