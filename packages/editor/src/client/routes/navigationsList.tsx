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
  NavigationsEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  NavigationsListRoute,
  NavigationsCreateRoute
} from '../route'

import {useNavigationsListQuery, useDeleteNavigationMutation, FullNavigationFragment} from '../api'
import {NavigationEditPanel} from '../panel/navigationEditPanel'
import {RouteActionType} from '@karma.run/react'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {useTranslation} from 'react-i18next'

enum ConfirmAction {
  Delete = 'delete'
}

export function NavigationsList() {
  console.log('test')
  const {t} = useTranslation()
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.NavigationsEdit || current?.type === RouteType.NavigationsCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.NavigationsEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentNavigation, setCurrentNavigation] = useState<FullNavigationFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, loading: isLoading} = useNavigationsListQuery({
    fetchPolicy: 'network-only'
  })

  const [deleteNavigation, {loading: isDeleting}] = useDeleteNavigationMutation()

  useEffect(() => {
    switch (current?.type) {
      case RouteType.NavigationsCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.NavigationsEdit:
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
          <Link route={NavigationsEditRoute.create({id})}>
            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || t('navigations.overview.unknown')}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={[
              {
                id: ConfirmAction.Delete,
                label: t('navigations.overview.delete'),
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
        <Typography variant="h1">{t('navigations.overview.navigations')}</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label={t('navigations.overview.newNavigation')}
          route={NavigationsCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder={t('navigations.overview.search')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {navigations?.length ? (
          <>{navigations}</>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            {t('navigations.overview.noNavigationsFound')}
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
                route: NavigationsListRoute.create({}, current ?? undefined)
              })
            }}
            onSave={() => {
              setEditModalOpen(false)
              dispatch({
                type: RouteActionType.PushRoute,
                route: NavigationsListRoute.create({}, current ?? undefined)
              })
            }}
          />
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={t('navigations.overview.deleteNavigation')}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('navigations.overview.cancel')}
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label={t('navigations.overview.confirm')}
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
                <DescriptionListItem label={t('navigations.overview.name')}>
                  {currentNavigation?.name || t('navigations.overview.unknown')}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
