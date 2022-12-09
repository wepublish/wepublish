import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete, MdSearch} from 'react-icons/md'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Avatar,
  Button,
  Drawer,
  FlexboxGrid,
  IconButton,
  Input,
  InputGroup,
  Modal,
  Pagination,
  Table
} from 'rsuite'

import {AuthorSort, FullAuthorFragment, useAuthorListQuery, useDeleteAuthorMutation} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {AuthorEditPanel} from '../panel/authorEditPanel'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../utility'

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

function AuthorList() {
  const {t} = useTranslation()
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isCreateRoute = location.pathname.includes('create')
  const isEditRoute = location.pathname.includes('edit')

  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute || isCreateRoute)

  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

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
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
  }

  const {
    data,
    loading: isLoading,
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
    if (isCreateRoute) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (isEditRoute) {
      setEditID(id)
      setEditModalOpen(true)
    }
  }, [location])

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
        <PermissionControl qualifyingPermissions={['CAN_CREATE_AUTHOR']}>
          <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
            <Link to="/authors/create">
              <IconButton appearance="primary" disabled={isLoading} icon={<MdAdd />}>
                {t('authors.overview.newAuthor')}
              </IconButton>
            </Link>
          </FlexboxGrid.Item>
        </PermissionControl>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <MdSearch />
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
                <Link to={`/authors/edit/${rowData.id}`}>
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
                <PermissionControl qualifyingPermissions={['CAN_DELETE_AUTHOR']}>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      icon={<MdDelete />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setConfirmationDialogOpen(true)
                        setCurrentAuthor(rowData)
                      }}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
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
        size="sm"
        onClose={() => {
          setEditModalOpen(false)
          navigate('/authors')
        }}>
        <AuthorEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            navigate('/authors')
          }}
          onSave={() => {
            setEditModalOpen(false)
            navigate('/authors')
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

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_AUTHORS',
  'CAN_GET_AUTHOR',
  'CAN_DELETE_AUTHOR',
  'CAN_CREATE_AUTHOR'
])(AuthorList)
export {CheckedPermissionComponent as AuthorList}
