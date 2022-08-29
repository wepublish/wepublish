import SearchIcon from '@rsuite/icons/legacy/Search'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {Button, Drawer, FlexboxGrid, IconButton, Input, InputGroup, Modal, Table} from 'rsuite'

import {FullNavigationFragment, useDeleteNavigationMutation, useNavigationListQuery} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {NavigationEditPanel} from '../panel/navigationEditPanel'

const {Column, HeaderCell, Cell} = Table

export function NavigationList() {
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
  const [navigations, setNavigations] = useState<FullNavigationFragment[]>([])
  const [currentNavigation, setCurrentNavigation] = useState<FullNavigationFragment>()

  const {data, refetch, loading: isLoading} = useNavigationListQuery({
    fetchPolicy: 'network-only'
  })

  const [deleteNavigation, {loading: isDeleting}] = useDeleteNavigationMutation()

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
    if (data?.navigations) {
      setNavigations(data.navigations)
    }
  }, [data?.navigations])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('navigation.overview.navigations')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <Link to="/navigations/create">
            <Button appearance="primary" disabled={isLoading}>
              {t('navigation.overview.newNavigation')}
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

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={navigations}>
        <Column width={400} align="left" resizable>
          <HeaderCell>{t('navigation.overview.name')}</HeaderCell>
          <Cell>
            {(rowData: FullNavigationFragment) => (
              <Link to={`/navigations/edit/${rowData.id}`}>
                {rowData.name || t('navigation.overview.unknown')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('navigation.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullNavigationFragment) => (
              <>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    icon={<TrashIcon />}
                    circle
                    size="sm"
                    style={{marginLeft: '5px'}}
                    onClick={() => {
                      setCurrentNavigation(rowData)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                </IconButtonTooltip>
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
          setEditModalOpen(false)
          navigate('/navigations')
        }}>
        <NavigationEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            navigate('/navigations')
          }}
          onSave={() => {
            setEditModalOpen(false)
            navigate('/navigations')
          }}
        />
      </Drawer>

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('navigation.overview.deleteNavigation')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('navigation.overview.name')}>
              {currentNavigation?.name || t('navigation.overview.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentNavigation) return
              await deleteNavigation({
                variables: {id: currentNavigation.id}
              })

              setConfirmationDialogOpen(false)
              refetch()
            }}
            color="red">
            {t('navigation.overview.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('navigation.overview.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
