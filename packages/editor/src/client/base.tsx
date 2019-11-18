import React, {ReactNode} from 'react'

import {NavigationTemplate} from '@karma.run/ui'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconTextFields,
  MaterialIconPhotoLibraryOutlined
} from '@karma.run/icons'

import {
  RouteMenuLinkButton,
  LogoutRoute,
  ArticleListRoute,
  PageListRoute,
  ImageListRoute
} from './route'

export interface BaseProps {
  readonly children?: ReactNode
}

export function Base({children}: BaseProps) {
  return (
    <NavigationTemplate
      navigationChildren={
        <>
          <RouteMenuLinkButton
            icon={MaterialIconTextFields}
            label="Articles"
            route={ArticleListRoute.create({})}
          />

          <RouteMenuLinkButton
            icon={MaterialIconInsertDriveFileOutlined}
            label="Pages"
            route={PageListRoute.create({})}
          />

          <RouteMenuLinkButton
            icon={MaterialIconPhotoLibraryOutlined}
            label="Image Library"
            route={ImageListRoute.create({})}
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
