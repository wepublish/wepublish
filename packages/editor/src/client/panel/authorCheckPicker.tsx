import React, {useState, useEffect} from 'react'
import {Button, CheckPicker} from 'rsuite'
import {useTranslation, Trans} from 'react-i18next'

import {slugify, getOperationNameFromDocument} from '../utility'
import {
  useAuthorListQuery,
  AuthorRefFragment,
  useCreateAuthorMutation,
  AuthorListDocument
} from '../api'

export interface AuthorCheckPicker {
  readonly authors: AuthorRefFragment[]
  readonly socialMediaAuthors: AuthorRefFragment[]
}

export interface AuthorCheckPickerProps {
  readonly value: AuthorCheckPicker
  onClose?(): void
  onChange?(value: AuthorCheckPicker): void
}

export function AuthorCheckPicker({value, onChange}: AuthorCheckPickerProps) {
  const {t} = useTranslation()  
  const {authors, socialMediaAuthors} = value

  const [foundAuthors, setFoundAuthors] = useState<AuthorRefFragment[]>([])
  const [foundSocialMediaAuthors, setFoundSocialMediaAuthors] = useState<AuthorRefFragment[]>([])
  const [authorsFilter, setAuthorsFilter] = useState('')

  const authorsVariables = {filter: authorsFilter || undefined, first: 10}
  const {data} = useAuthorListQuery({
    variables: authorsVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (data?.authors?.nodes) {
      const authorIDs = data.authors.nodes.map(author => author.id)
      const selectedAuthors = authors.filter(author => !authorIDs.includes(author.id))
      setFoundAuthors([...data.authors.nodes, ...selectedAuthors])
      const selectedSocialMediaAuthors = socialMediaAuthors.filter(
        author => !authorIDs.includes(author.id)
      )
      setFoundSocialMediaAuthors([...data.authors.nodes, ...selectedSocialMediaAuthors])
    }
  }, [data?.authors, authors, socialMediaAuthors])

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
      value={socialMediaAuthors?.map(socialMediaAuthor => socialMediaAuthor.id)}
      data={foundSocialMediaAuthors.map(author => ({
        value: author.id,
        label: author.name
      }))}
      onSearch={searchKeyword => {
        setAuthorsFilter(searchKeyword)
      }}
      onChange={socialMediaAuthorIDs => {
        const socialMediaAuthors = foundSocialMediaAuthors.filter(author =>
          socialMediaAuthorIDs.includes(author.id)
        )
        onChange?.({...value, socialMediaAuthors})
      }}
      onExit={() => {
        setAuthorsFilter('')
      }}
      block
      renderExtraFooter={() =>
        authorsFilter &&
        !data?.authors.nodes.length && (
          <div style={{margin: '20px'}}>
            <Button onClick={() => handleCreateAuthor()} appearance="primary">
              {t('articles.panels.createAuthorProfile', {name: authorsFilter})}
            </Button>
          </div>
        )
      }
    />
  )
}
