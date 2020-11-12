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
  IconButton,
  Input,
  InputGroup,
  Table,
  Avatar,
  Drawer,
  Modal,
  Button
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
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

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [authors, setAuthors] = useState<FullAuthorFragment[]>([])
  const [currentAuthor, setCurrentAuthor] = useState<FullAuthorFragment>()

  const {data, /* fetchMore, */ loading: isLoading} = useAuthorListQuery({
    variables: {
      filter: filter || undefined,
      first: 50
    },
    fetchPolicy: 'network-only'
  })

  const [deleteAuthor, {loading: isDeleting}] = useDeleteAuthorMutation()

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
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={authors}>
        <Column width={100} align="left" resizable>
          <HeaderCell></HeaderCell>
          <Cell style={{padding: 2}}>
            {(rowData: FullAuthorFragment) => (
              <Avatar circle src={rowData.image?.squareURL || undefined} />
            )}
          </Cell>
        </Column>
        <Column width={400} align="left" resizable>
          <HeaderCell>Name</HeaderCell>
          <Cell>
            {(rowData: FullAuthorFragment) => (
              <Link route={AuthorEditRoute.create({id: rowData.id})}>
                {rowData.name || t('authors.overview.untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>Action</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullAuthorFragment) => (
              <>
                <IconButton
                  icon={<Icon icon="trash" />}
                  circle
                  size="sm"
                  style={{marginLeft: '5px'}}
                  onClick={() => {
                    setConfirmationDialogOpen(true)
                    setCurrentAuthor(rowData)
                  }}
                />
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        show={isEditModalOpen}
        size={'sm'}
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
      </Drawer>

      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('authors.overview.deleteAuthor')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('authors.overview.name')}>
              {currentAuthor?.name || t('authors.overview.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentAuthor) return

              await deleteAuthor({
                variables: {id: currentAuthor.id}
              })

              setConfirmationDialogOpen(false)
              // fetchMore()
            }}
            color="red">
            {t('authors.overview.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('authors.overview.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
