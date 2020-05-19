import React, {ReactNode} from 'react'

import {NavigationTemplate} from '@karma.run/ui'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconTextFields,
  MaterialIconPhotoLibraryOutlined,
  MaterialIconPermIdentityOutlined,
  MaterialIconFaceOutlined,
  MaterialIconHowToRegOutlined
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
  UserListRoute,
  UserRoleListRoute
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
            icon={MaterialIconFaceOutlined}
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
            icon={MaterialIconPermIdentityOutlined}
            label="Users"
            route={UserListRoute.create({})}
            active={current?.type === RouteType.UserList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconHowToRegOutlined}
            label="User Roles"
            route={UserRoleListRoute.create({})}
            active={current?.type === RouteType.UserRoleList}
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
