import SearchIcon from '@rsuite/icons/legacy/Search'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {Button, Drawer, FlexboxGrid, IconButton, Input, InputGroup, Modal, Table} from 'rsuite'

import {FullUserRoleFragment, useDeleteUserRoleMutation, useUserRoleListQuery} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {UserRoleEditPanel} from '../panel/userRoleEditPanel'

const {Column, HeaderCell, Cell} = Table

export function UserRoleList() {
  const {t} = useTranslation()

  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isCreateRoute = location.pathname.includes('create')
  const isEditRoute = location.pathname.includes('edit')

  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute || isCreateRoute)

  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<FullUserRoleFragment>()

  const {data, refetch, loading: isLoading} = useUserRoleListQuery({
    variables: {
      filter: filter || undefined,
      take: 200
    },
    fetchPolicy: 'network-only'
  })

  const [deleteUserRole, {loading: isDeleting}] = useDeleteUserRoleMutation()

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
    if (data?.userRoles?.nodes) {
      setUserRoles(data.userRoles.nodes)
    }
  }, [data?.userRoles])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('userRoles.overview.userRoles')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <Link to="/userroles/create">
            <Button appearance="primary" disabled={isLoading}>
              {t('userRoles.overview.newUserRole')}
            </Button>
          </Link>
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

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={userRoles}>
        <Column width={200} align="left" resizable>
          <HeaderCell>{t('userRoles.overview.name')}</HeaderCell>
          <Cell>
            {(rowData: FullUserRoleFragment) => (
              <Link to={`/userroles/edit/${rowData.id}`}>
                {rowData.name || t('userRoles.overview.untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={400} align="left" resizable>
          <HeaderCell>{t('userRoles.overview.description')}</HeaderCell>
          <Cell dataKey="description" />
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('userRoles.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullUserRoleFragment) => (
              <IconButtonTooltip caption={t('delete')}>
                <IconButton
                  icon={<TrashIcon />}
                  disabled={rowData.systemRole}
                  circle
                  size="sm"
                  style={{marginLeft: '5px'}}
                  onClick={() => {
                    setConfirmationDialogOpen(true)
                    setCurrentUserRole(rowData)
                  }}
                />
              </IconButtonTooltip>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        open={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          navigate('/userroles')
        }}
        size={'sm'}>
        <UserRoleEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false)
            navigate('/userroles')
          }}
          onSave={() => {
            setEditModalOpen(false)
            refetch()
            navigate('/userroles')
          }}
        />
      </Drawer>

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userRoles.panels.deleteUserRole')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('userRoles.panels.name')}>
              {currentUserRole?.name || t('userRoles.panels.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentUserRole) return

              await deleteUserRole({
                variables: {id: currentUserRole.id}
              })

              setConfirmationDialogOpen(false)
              refetch()
            }}
            color="red">
            {t('userRoles.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('userRoles.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
