import React, {ReactNode} from 'react'

import {NavigationTemplate, Divider} from '@karma.run/ui'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconTextFields,
  MaterialIconPhotoLibraryOutlined,
  MaterialIconPermIdentityOutlined,
  MaterialIconSettings,
  MaterialIconShareOutlined,
  MaterialIcon3dRotation
} from '@karma.run/icons'

import {
  RouteMenuLinkButton,
  LogoutRoute,
  ArticleListRoute,
  PageListRoute,
  ImageListRoute,
  AuthorListRoute,
  useRoute,
  RouteType,
  PeeringRoute,
  SettingsRoute
} from './route'

export interface BaseProps {
  children?: ReactNode
}

export function Base({children}: BaseProps) {
  const {current} = useRoute()

  return (
    <NavigationTemplate
      navigationChildren={
        <>
          <RouteMenuLinkButton
            icon={MaterialIconTextFields}
            label="Articles"
            route={ArticleListRoute.create({})}
            active={current?.type === RouteType.ArticleList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconInsertDriveFileOutlined}
            label="Pages"
            route={PageListRoute.create({})}
            active={current?.type === RouteType.PageList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconPermIdentityOutlined}
            label="Authors"
            route={AuthorListRoute.create({})}
            active={current?.type === RouteType.AuthorList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconPhotoLibraryOutlined}
            label="Image Library"
            route={ImageListRoute.create({})}
            active={current?.type === RouteType.ImageList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconShareOutlined}
            label="Peering"
            route={PeeringRoute.create({})}
            active={current?.type === RouteType.Peering}
          />

          <Divider />

          <RouteMenuLinkButton
            icon={MaterialIconSettings}
            label="Settings"
            route={SettingsRoute.create({})}
            active={current?.type === RouteType.Settings}
          />

          <RouteMenuLinkButton
            icon={MaterialIcon3dRotation}
            label="Settings"
            route={SettingsRoute.create({})}
            active={current?.type === RouteType.Settings}
          />

          {/* TODO */}
          {/* <RouteMenuIconLinkButton
            icon={MaterialIconNavigationOutlined}
            label="Navigation"
            route={ImageListRoute.create({})}
          /> */}

          <RouteMenuLinkButton
            icon={MaterialIconPowerSettingsNew}
            label="Logout"
            route={LogoutRoute.create({})}
          />
        </>
      }>
      {children}
    </NavigationTemplate>
  )
}
