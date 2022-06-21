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

import {useAuthorListQuery, useDeleteAuthorMutation, FullAuthorFragment, AuthorSort} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {AuthorEditPanel} from '../panel/authorEditPanel'
import {RouteActionType} from '@wepublish/karma.run-react'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  IconButton,
  Input,
  InputGroup,
  Table,
  Avatar,
  Drawer,
  Modal,
  Button,
  Pagination
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../utility'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'

const {Column, HeaderCell, Cell} = Table

function mapColumFieldToGraphQLField(columnField: string): AuthorSort | null {
  switch (columnField) {
    case 'createdAt':
      return AuthorSort.CreatedAt
    case 'modifiedAt':
      return AuthorSort.ModifiedAt
    case 'name':
      return AuthorSort.Name
    default:
      return null
  }
}

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

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [authors, setAuthors] = useState<FullAuthorFragment[]>([])
  const [currentAuthor, setCurrentAuthor] = useState<FullAuthorFragment>()

  const authorListQueryVariables = {
    filter: filter || undefined,
    skip: page - 1,
    sort: mapColumFieldToGraphQLField(sortField),
    first: limit,
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
  }

  const {
    data,
    /* fetchMore, */ loading: isLoading,
    refetch: authorListRefetch
  } = useAuthorListQuery({
    variables: authorListQueryVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    authorListRefetch(authorListQueryVariables)
  }, [filter, page, limit, sortOrder, sortField])

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
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          minHeight={600}
          autoHeight
          style={{flex: 1}}
          loading={isLoading}
          data={authors}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}>
          <Column width={100} align="left" resizable>
            <HeaderCell>{}</HeaderCell>
            <Cell style={{padding: 2}}>
              {(rowData: FullAuthorFragment) => (
                <Avatar circle src={rowData.image?.squareURL || undefined} />
              )}
            </Cell>
          </Column>
          <Column width={300} align="left" resizable sortable>
            <HeaderCell>{t('authors.overview.name')}</HeaderCell>
            <Cell dataKey="name">
              {(rowData: FullAuthorFragment) => (
                <Link route={AuthorEditRoute.create({id: rowData.id})}>
                  {rowData.name || t('authors.overview.untitled')}
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={200} align="left" resizable sortable>
            <HeaderCell>{t('authors.overview.created')}</HeaderCell>
            <Cell dataKey="createdAt">
              {({createdAt}: FullAuthorFragment) =>
                t('authors.overview.createdAt', {
                  createdAt: new Date(createdAt)
                })
              }
            </Cell>
          </Column>
          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('authors.overview.action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: FullAuthorFragment) => (
                <>
                  <IconButtonTooltip caption={t('authors.overview.delete')}>
                    <IconButton
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setConfirmationDialogOpen(true)
                        setCurrentAuthor(rowData)
                      }}
                    />
                  </IconButtonTooltip>
                </>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.authors.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
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

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
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

              await authorListRefetch(authorListQueryVariables)

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
