import styled from '@emotion/styled'
import {
  AuthorListDocument,
  AuthorRefFragment,
  useAuthorListQuery,
  useCreateAuthorMutation
} from '@wepublish/editor/api'
import {getOperationNameFromDocument} from '../utility'
import {slugify} from '@wepublish/utils'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, CheckPicker} from 'rsuite'
import {PeerAvatar} from '../atoms/peer/peerAvatar'

const ButtonWrapper = styled.div`
  margin: 10px;
`

export interface AuthorCheckPickerProps {
  readonly list: AuthorRefFragment[]
  disabled?: boolean
  onClose?(): void
  onChange?(authors: AuthorRefFragment[]): void
}

export function AuthorCheckPicker({list, disabled, onChange}: AuthorCheckPickerProps) {
  const {t} = useTranslation()
  const [foundAuthors, setFoundAuthors] = useState<AuthorRefFragment[]>([])
  const [authorsFilter, setAuthorsFilter] = useState('')

  const authorsVariables = {filter: authorsFilter || undefined, take: 10}
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
      disabled={disabled}
      virtualized
      cleanable
      value={list.map(author => author.id)}
      data={foundAuthors.map(author => ({value: author.id, label: author.name, peer: author.peer}))}
      placeholder={t('blocks.quote.author')}
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
      renderMenuItem={(label, item) => {
        const peer = foundAuthors.find(author => author.id === item.value)?.peer

        return <PeerAvatar peer={peer}>{label}</PeerAvatar>
      }}
      renderExtraFooter={() =>
        authorsFilter &&
        !data?.authors.nodes.length && (
          <ButtonWrapper>
            <Button onClick={() => handleCreateAuthor()} appearance="primary">
              {t('articles.panels.createAuthorProfile', {name: authorsFilter})}
            </Button>
          </ButtonWrapper>
        )
      }
    />
  )
}
