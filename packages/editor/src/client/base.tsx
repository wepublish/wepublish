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
  MaterialIconHowToRegOutlined,
  MaterialIconFormatQuoteOutlined
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
  UserRoleListRoute,
  MemberPlanListRoute
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
            label={t('navbar.articles')}
            route={ArticleListRoute.create({})}
            active={current?.type === RouteType.ArticleList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconInsertDriveFileOutlined}
            label={t('navbar.pages')}
            route={PageListRoute.create({})}
            active={current?.type === RouteType.PageList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconFaceOutlined}
            label={t('navbar.authors')}
            route={AuthorListRoute.create({})}
            active={current?.type === RouteType.AuthorList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconPhotoLibraryOutlined}
            label={t('navbar.imageLibrary')}
            route={ImageListRoute.create({})}
            active={current?.type === RouteType.ImageList}
          />

          <Divider />

          <RouteMenuLinkButton
            icon={MaterialIconPermIdentityOutlined}
            label={t('navbar.users')}
            route={UserListRoute.create({})}
            active={current?.type === RouteType.UserList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconHowToRegOutlined}
            label={t('navbar.userRoles')}
            route={UserRoleListRoute.create({})}
            active={current?.type === RouteType.UserRoleList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconFormatQuoteOutlined}
            label="Member Plans"
            route={MemberPlanListRoute.create({})}
            active={current?.type === RouteType.MemberPlanList}
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
            label={t('navbar.peering')}
            route={PeerListRoute.create({})}
            active={current?.type === RouteType.PeerList}
          />

          <RouteMenuLinkButton
            icon={MaterialIconLockOutlined}
            label={t('navbar.tokens')}
            route={TokenListRoute.create({})}
            active={current?.type === RouteType.TokenList}
          />

          <Divider />

          <RouteMenuLinkButton
            icon={MaterialIconPowerSettingsNew}
            label={t('navbar.logout')}
            route={LogoutRoute.create({})}
          />
        </>
      }>
      {children}
    </NavigationTemplate>
  )
}
