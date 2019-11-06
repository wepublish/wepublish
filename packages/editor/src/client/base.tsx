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
  MenuIconRouteLinkButton,
  LogoutRoute,
  ArticleListRoute,
  FrontListRoute,
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
          <MenuIconRouteLinkButton
            icon={MaterialIconTextFields}
            label="Article"
            route={ArticleListRoute.create({})}
          />

          <MenuIconRouteLinkButton
            icon={MaterialIconInsertDriveFileOutlined}
            label="Page"
            route={FrontListRoute.create({})}
          />

          <MenuIconRouteLinkButton
            icon={MaterialIconPhotoLibraryOutlined}
            label="Image Library"
            route={ImageListRoute.create({})}
          />

          <MenuIconRouteLinkButton
            icon={MaterialIconNavigationOutlined}
            label="Navigation"
            route={ImageListRoute.create({})}
          />

          <MenuIconRouteLinkButton
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
