import React, {ReactNode} from 'react'

import {NavigationTemplate} from '@karma.run/ui'
import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconPhotoLibrary,
  MaterialIconTextFields,
  MaterialIconNavigation,
  MaterialIconPhotoLibraryOutlined,
  MaterialIconNavigationOutlined
} from '@karma.run/icons'

import {
  LinkMenuIconButton,
  LogoutRoute,
  ArticleListRoute,
  FrontListRoute,
  MediaListRoute
} from './route'

export interface BaseProps {
  readonly children?: ReactNode
}

export function Base({children}: BaseProps) {
  return (
    <NavigationTemplate
      navigationChildren={
        <>
          <LinkMenuIconButton
            icon={MaterialIconTextFields}
            label="Article"
            route={ArticleListRoute.create({})}
          />

          <LinkMenuIconButton
            icon={MaterialIconInsertDriveFileOutlined}
            label="Page"
            route={FrontListRoute.create({})}
          />

          <LinkMenuIconButton
            icon={MaterialIconPhotoLibraryOutlined}
            label="Media Library"
            route={MediaListRoute.create({})}
          />

          <LinkMenuIconButton
            icon={MaterialIconNavigationOutlined}
            label="Navigation"
            route={MediaListRoute.create({})}
          />

          <LinkMenuIconButton
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
