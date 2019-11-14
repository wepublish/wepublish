import React, {ReactNode} from 'react'

import {NavigationTemplate} from '@karma.run/ui'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconTextFields,
  MaterialIconPhotoLibraryOutlined,
  MaterialIconNavigationOutlined
} from '@karma.run/icons'

import {
  RouteMenuIconLinkButton,
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
          <RouteMenuIconLinkButton
            icon={MaterialIconTextFields}
            label="Articles"
            route={ArticleListRoute.create({})}
          />

          <RouteMenuIconLinkButton
            icon={MaterialIconInsertDriveFileOutlined}
            label="Pages"
            route={PageListRoute.create({})}
          />

          <RouteMenuIconLinkButton
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

          <RouteMenuIconLinkButton
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
