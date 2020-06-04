import React, {ReactNode} from 'react'

import {NavigationTemplate, Divider} from '@karma.run/ui'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconTextFields,
  MaterialIconPhotoLibraryOutlined,
  MaterialIconPermIdentityOutlined,
  MaterialIconShareOutlined,
  MaterialIconLockOutlined
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
  PeerListRoute,
  TokenListRoute
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

          {/* TODO */}
          {/* <RouteMenuIconLinkButton
            icon={MaterialIconNavigationOutlined}
            label="Navigation"
            route={ImageListRoute.create({})}
          /> */}

          <Divider />

          <RouteMenuLinkButton
            icon={MaterialIconShareOutlined}
            label="Peering"
            route={PeerListRoute.create({})}
            active={current?.type === RouteType.PeerList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconLockOutlined}
            label="Tokens"
            route={TokenListRoute.create({})}
            active={current?.type === RouteType.TokenList}
          />

          <Divider />

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
