import React, {useState, useEffect} from 'react'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Drawer,
  SearchInput,
  OptionButton,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {
  RouteLinkButton,
  Link,
  NavigationEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  NavigationListRoute,
  NavigationCreateRoute
} from '../route'

import {useNavigationListQuery, useDeleteNavigationMutation, FullNavigationFragment} from '../api'
import {NavigationEditPanel} from '../panel/navigationEditPanel'
import {RouteActionType} from '@karma.run/react'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {useTranslation} from 'react-i18next'

enum ConfirmAction {
  Delete = 'delete'
}

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
  const [currentNavigation, setCurrentNavigation] = useState<FullNavigationFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, loading: isLoading} = useNavigationListQuery({
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

  const navigations = data?.navigations.map(navigation => {
    const {id, name} = navigation

    return (
      <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
        <Box
          key={id}
          marginBottom={Spacing.ExtraSmall}
          display="flex"
          flexDirection="row"
          alignItems="center">
          <Link route={NavigationEditRoute.create({id})}>
            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || t('navigation.overview.unknown')}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={[
              {
                id: ConfirmAction.Delete,
                label: t('navigation.overview.delete'),
                icon: MaterialIconDeleteOutlined
              }
            ]}
            onMenuItemClick={item => {
              setCurrentNavigation(navigation)
              setConfirmationDialogOpen(true)
              setConfirmAction(item.id as ConfirmAction)
            }}
          />
        </Box>
        <Divider />
      </Box>
    )
  })

  return (
    <>
      <Box marginBottom={Spacing.Small} flexDirection="row" display="flex">
        <Typography variant="h1">{t('navigation.overview.navigations')}</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label={t('navigation.overview.newNavigation')}
          route={NavigationCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder={t('navigation.overview.search')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {navigations?.length ? (
          <>{navigations}</>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            {t('navigation.overview.noNavigationsFound')} {console.log(data)}
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
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
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={t('navigation.overview.deleteNavigation')}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('navigation.overview.cancel')}
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label={t('navigation.overview.confirm')}
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentNavigation) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteNavigation({
                          variables: {id: currentNavigation.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label={t('navigation.overview.name')}>
                  {currentNavigation?.name || t('navigation.overview.unknown')}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
