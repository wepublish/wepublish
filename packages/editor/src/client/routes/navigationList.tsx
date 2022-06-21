import React, {useState, useEffect} from 'react'

import {
  Link,
  NavigationEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  NavigationListRoute,
  NavigationCreateRoute,
  ButtonLink
} from '../route'

import {FlexboxGrid, IconButton, Input, InputGroup, Table, Drawer, Modal, Button} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {useNavigationListQuery, useDeleteNavigationMutation, FullNavigationFragment} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {NavigationEditPanel} from '../panel/navigationEditPanel'
import {RouteActionType} from '@wepublish/karma.run-react'

import {useTranslation} from 'react-i18next'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

export function NavigationList() {
  const {t} = useTranslation()
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.NavigationEdit || current?.type === RouteType.NavigationCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.NavigationEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [navigations, setNavigations] = useState<FullNavigationFragment[]>([])
  const [currentNavigation, setCurrentNavigation] = useState<FullNavigationFragment>()

  const {data, refetch, loading: isLoading} = useNavigationListQuery({
    fetchPolicy: 'network-only'
  })

  const [deleteNavigation, {loading: isDeleting}] = useDeleteNavigationMutation()

  useEffect(() => {
    switch (current?.type) {
      case RouteType.NavigationCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.NavigationEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

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
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={NavigationCreateRoute.create({})}>
            {t('navigation.overview.newNavigation')}
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

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={navigations}>
        <Column width={400} align="left" resizable>
          <HeaderCell>{t('navigation.overview.name')}</HeaderCell>
          <Cell>
            {(rowData: FullNavigationFragment) => (
              <Link route={NavigationEditRoute.create({id: rowData.id})}>
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
                <IconButtonTooltip caption={t('navigation.overview.delete')}>
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
          dispatch({
            type: RouteActionType.PushRoute,
            route: NavigationListRoute.create({}, current ?? undefined)
          })
        }}>
        <NavigationEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: NavigationListRoute.create({}, current ?? undefined)
            })
          }}
          onSave={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: NavigationListRoute.create({}, current ?? undefined)
            })
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
