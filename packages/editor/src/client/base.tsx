import React, {ReactNode} from 'react'

import {NavigationTemplate, Divider} from '@karma.run/ui'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPowerSettingsNew,
  MaterialIconTextFields,
  MaterialIconPhotoLibraryOutlined,
  MaterialIconPermIdentityOutlined,
  MaterialIconShareOutlined,
  MaterialIconLockOutlined,
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
  PeerListRoute,
  TokenListRoute,
  UserListRoute,
  UserRoleListRoute
} from './route'

import {useTranslation} from 'react-i18next'

export interface BaseProps {
  children?: ReactNode
}

export function Base({children}: BaseProps) {
  const {current} = useRoute()

  const {t} = useTranslation()

  return (
    <NavigationTemplate
      navigationChildren={
        <>
          <RouteMenuLinkButton
            icon={MaterialIconTextFields}
            label={t('Articles')}
            route={ArticleListRoute.create({})}
            active={current?.type === RouteType.ArticleList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconInsertDriveFileOutlined}
            label={t('Some Pages')}
            route={PageListRoute.create({})}
            active={current?.type === RouteType.PageList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconFaceOutlined}
            label={t('Authors')}
            route={AuthorListRoute.create({})}
            active={current?.type === RouteType.AuthorList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconPhotoLibraryOutlined}
            label={t('Image Library')}
            route={ImageListRoute.create({})}
            active={current?.type === RouteType.ImageList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconPermIdentityOutlined}
            label={t('Users')}
            route={UserListRoute.create({})}
            active={current?.type === RouteType.UserList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconHowToRegOutlined}
            label={t('User Roles')}
            route={UserRoleListRoute.create({})}
            active={current?.type === RouteType.UserRoleList}
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
            label={t('Peering')}
            route={PeerListRoute.create({})}
            active={current?.type === RouteType.PeerList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconLockOutlined}
            label={t('Tokens')}
            route={TokenListRoute.create({})}
            active={current?.type === RouteType.TokenList}
          />

          <Divider />

          <RouteMenuLinkButton
            icon={MaterialIconPowerSettingsNew}
            label={t('Logout')}
            route={LogoutRoute.create({})}
          />
        </>
      }>
      {children}
    </NavigationTemplate>
  )
}
