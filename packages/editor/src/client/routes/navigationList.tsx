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

import {FlexboxGrid, Icon, Input, InputGroup, Table, Modal, Button, Popover, Whisper} from 'rsuite'

import {useNavigationListQuery, useDeleteNavigationMutation, FullNavigationFragment} from '../api'
import {NavigationEditPanel} from '../panel/navigationEditPanel'
import {RouteActionType} from '@karma.run/react'

import {useTranslation} from 'react-i18next'
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

  const [navigations, setNavigations] = useState<FullNavigationFragment[]>([])
  const [currentNavigation, setCurrentNavigation] = useState<FullNavigationFragment>()

  const {data, refetch, loading: isLoading} = useNavigationListQuery({
    fetchPolicy: 'network-only'
  })

  const [deleteNavigation, {loading: isDeleting}] = useDeleteNavigationMutation()

  const rowDeleteButton = (rowData: any) => {
    const triggerRef = React.createRef<any>()
    const close = () => triggerRef.current.close()
    const speaker = (
      <Popover title={currentNavigation?.name}>
        <Button
          color="red"
          disabled={isDeleting}
          onClick={() => {
            if (!currentNavigation) return
            close()
            deleteNavigation({
              variables: {id: currentNavigation.id}
            })
              .then(() => {
                refetch()
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
              setCurrentNavigation(rowData)
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
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
            <Input value={filter} onChange={value => setFilter(value)} />
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={navigations}>
        <Column flexGrow={4} align="left">
          <HeaderCell>{t('navigation.overview.name')}</HeaderCell>
          <Cell>
            {(rowData: FullNavigationFragment) => (
              <Link route={NavigationEditRoute.create({id: rowData.id})}>
                {rowData.name || t('navigation.overview.unknown')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="right" fixed="right">
          <HeaderCell>{t('navigation.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullNavigationFragment) => <>{rowDeleteButton(rowData)}</>}
          </Cell>
        </Column>
      </Table>

      <Modal
        show={isEditModalOpen}
        size={'sm'}
        onHide={() => {
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
      </Modal>
    </>
  )
}
