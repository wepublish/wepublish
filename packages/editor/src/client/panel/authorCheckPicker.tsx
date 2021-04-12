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

// export interface AuthorCheckPicker {
//   readonly authors: AuthorRefFragment[]
//   // readonly socialMediaAuthors: AuthorRefFragment[]
// }

export interface AuthorCheckPickerProps {
  readonly list: AuthorRefFragment[]
  onClose?(): void
  onChange?(list: AuthorRefFragment[]): void
}

export function AuthorCheckPicker({list, onChange}: AuthorCheckPickerProps) {
  const {t} = useTranslation()
  // const {authors} = list

  const [foundAuthors, setFoundAuthors] = useState<AuthorRefFragment[]>([])
  // const [foundSocialMediaAuthors, setFoundSocialMediaAuthors] = useState<AuthorRefFragment[]>([])
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
      // const selectedSocialMediaAuthors = socialMediaAuthors.filter(
      //   author => !authorIDs.includes(author.id)
      // )
      // setFoundSocialMediaAuthors([...data.authors.nodes, ...selectedSocialMediaAuthors])
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
      cleanable={true}
      value={list.map(author => author.id)}
      data={foundAuthors.map(author => ({value: author.id, label: author.name}))}
      onSearch={searchKeyword => {
        setAuthorsFilter(searchKeyword)
      }}
      onChange={authorsID => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const authors: AuthorRefFragment = foundAuthors.filter(author => authorsID.includes(author.id))
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onChange?.({...list, authors})
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
