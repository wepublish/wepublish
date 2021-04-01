import React, {useState, useEffect} from 'react'

import {
  AuthorEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  AuthorListRoute,
  AuthorCreateRoute,
  ButtonLink,
  Link
} from '../route'

import {useAuthorListQuery, useDeleteAuthorMutation, FullAuthorFragment} from '../api'
import {AuthorEditPanel} from '../panel/authorEditPanel'
import {RouteActionType} from '@karma.run/react'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Icon,
  Input,
  InputGroup,
  Table,
  Avatar,
  Button,
  Popover,
  Whisper,
  Modal
} from 'rsuite'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

export function AuthorList() {
  const {t} = useTranslation()
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.AuthorEdit || current?.type === RouteType.AuthorCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.AuthorEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [authors, setAuthors] = useState<FullAuthorFragment[]>([])
  const [currentAuthor, setCurrentAuthor] = useState<FullAuthorFragment>()

  const authorListQueryVariables = {
    filter: filter || undefined,
    first: 50
  }

  const {
    data,
    /* fetchMore, */ loading: isLoading,
    refetch: authorListRefetch
  } = useAuthorListQuery({
    variables: authorListQueryVariables,
    fetchPolicy: 'network-only'
  })

  const [deleteAuthor, {loading: isDeleting}] = useDeleteAuthorMutation()

  const rowDeleteButton = (rowData: any) => {
    const triggerRef = React.createRef<any>()
    const close = () => triggerRef.current.close()
    const speaker = (
      <Popover title={currentAuthor?.name}>
        <Button
          color="red"
          disabled={isDeleting}
          onClick={() => {
            if (!currentAuthor) return
            close()
            deleteAuthor({
              variables: {id: currentAuthor.id}
            })
              .then(() => {
                authorListRefetch(authorListQueryVariables)
              })
              .catch(console.error)
          }}>
          {t('global.buttons.deleteNow')}
        </Button>
      </Popover>
    )
    return (
      <>
        <Whisper placement="left" trigger="click" speaker={speaker} ref={triggerRef}>
          <Button
            appearance="link"
            color="red"
            onClick={() => {
              setCurrentAuthor(rowData)
            }}>
            {' '}
            {t('global.buttons.delete')}{' '}
          </Button>
        </Whisper>
      </>
    )
  }

  useEffect(() => {
    switch (current?.type) {
      case RouteType.AuthorCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.AuthorEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

  useEffect(() => {
    if (data?.authors?.nodes) {
      setAuthors(data.authors.nodes)
    }
  }, [data?.authors])

  /* function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.authors.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          authors: {
            ...fetchMoreResult.authors,
            nodes: [...prev.authors.nodes, ...fetchMoreResult?.authors.nodes]
          }
        }
      }
    })
  } */

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('authors.overview.authors')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={AuthorCreateRoute.create({})}>
            {t('authors.overview.newAuthor')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
            <Input value={filter} onChange={value => setFilter(value)} />
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={authors}>
        <Column width={60} align="left">
          <HeaderCell></HeaderCell>
          <Cell style={{padding: 2}}>
            {(rowData: FullAuthorFragment) => (
              <Avatar circle src={rowData.image?.squareURL || undefined} />
            )}
          </Cell>
        </Column>
        <Column flexGrow={4} align="left">
          <HeaderCell>{t('authors.overview.name')}</HeaderCell>
          <Cell>
            {(rowData: FullAuthorFragment) => (
              <Link route={AuthorEditRoute.create({id: rowData.id})}>
                {rowData.name || t('authors.overview.untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column flexGrow={1} align="right" fixed="right">
          <HeaderCell>{t('authors.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullAuthorFragment) => <>{rowDeleteButton(rowData)}</>}
          </Cell>
        </Column>
      </Table>

      <Modal
        size={'sm'}
        show={isEditModalOpen}
        onHide={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: AuthorListRoute.create({}, current ?? undefined)
          })
        }}>
        <AuthorEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: AuthorListRoute.create({}, current ?? undefined)
            })
          }}
          onSave={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: AuthorListRoute.create({}, current ?? undefined)
            })
          }}
        />
      </Modal>
    </>
  )
}
