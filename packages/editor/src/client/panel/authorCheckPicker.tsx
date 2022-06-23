import React, {useState, useEffect} from 'react'
import {Button, CheckPicker} from 'rsuite'
import {useTranslation} from 'react-i18next'

import {slugify, getOperationNameFromDocument} from '../utility'
import {
  useAuthorListQuery,
  AuthorRefFragment,
  useCreateAuthorMutation,
  AuthorListDocument
} from '../api'
export interface AuthorCheckPickerProps {
  readonly list: AuthorRefFragment[]
  onClose?(): void
  onChange?(authors: AuthorRefFragment[]): void
}

export function AuthorCheckPicker({list, onChange}: AuthorCheckPickerProps) {
  const {t} = useTranslation()

  const [foundAuthors, setFoundAuthors] = useState<AuthorRefFragment[]>([])
  const [authorsFilter, setAuthorsFilter] = useState('')

  const authorsVariables = {filter: authorsFilter || undefined, first: 10}
  const {data} = useAuthorListQuery({
    variables: authorsVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (data?.authors?.nodes) {
      const authorIDs = data.authors.nodes.map(author => author.id)
      const selectedAuthors = list.filter(author => !authorIDs.includes(author.id))
      setFoundAuthors([...data.authors.nodes, ...selectedAuthors])
    }
  }, [data?.authors, list])

  const [createAuthor] = useCreateAuthorMutation({
    refetchQueries: [getOperationNameFromDocument(AuthorListDocument)]
  })

  async function handleCreateAuthor() {
    await createAuthor({
      variables: {
        input: {
          name: authorsFilter,
          slug: slugify(authorsFilter)
        }
      }
    })
  }

  return (
    <CheckPicker
      virtualized
      cleanable
      value={list.map(author => author.id)}
      data={foundAuthors.map(author => ({value: author.id, label: author.name}))}
      onSearch={searchKeyword => {
        setAuthorsFilter(searchKeyword)
      }}
      onChange={authorsID => {
        const authors = foundAuthors.filter(author => authorsID.includes(author.id))
        onChange?.(authors)
      }}
      onExit={() => {
        setAuthorsFilter('')
      }}
      block
      renderExtraFooter={() =>
        authorsFilter &&
        !data?.authors.nodes.length && (
          <div style={{margin: '10px'}}>
            <Button onClick={() => handleCreateAuthor()} appearance="primary">
              {t('articles.panels.createAuthorProfile', {name: authorsFilter})}
            </Button>
          </div>
        )
      }
    />
  )
}
