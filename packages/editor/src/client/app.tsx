import {hot} from 'react-hot-loader/root'
import React, {useContext, useEffect, useState} from 'react'

import 'rsuite/styles/index.less'

import {useRoute, RouteType, Route, useRouteDispatch, LoginRoute} from './route'

import {Login} from './login'
import {Base} from './base'
import {ArticleList} from './routes/articleList'

import {ArticleEditor} from './routes/articleEditor'
import {ImageList} from './routes/imageList'
import {PageList} from './routes/pageList'
import {PageEditor} from './routes/pageEditor'
import {AuthorList} from './routes/authorList'
import {PeerList} from './routes/peerList'
import {TokenList} from './routes/tokenList'
import {UserList} from './routes/userList'
import {CommentList} from './routes/commentList'
import {UserRoleList} from './routes/userRoleList'
import {MemberPlanList} from './routes/memberPlanList'
import {PaymentMethodList} from './routes/paymentMethodList'
import {PeerArticleList} from './routes/peerArticleList'
import {NavigationList} from './routes/navigationList'

import './global.less'
import {CustomProvider} from 'rsuite'
import enGB from 'rsuite/locales/en_GB'
import fr from './locales/rsuiteFr'
import de from './locales/rsuiteDe'
import {useTranslation} from 'react-i18next'
import {AuthContext} from './authContext'
import {RouteActionType} from '@wepublish/karma.run-react'
import {SubscriptionList} from './routes/subscriptionList'
import {UserEditView} from './routes/userEditView'
import {SettingList} from './routes/settingList'

export function contentForRoute(route: Route) {
  switch (route.type) {
    case RouteType.Login:
      return <Login />

    case RouteType.PeerList:
    case RouteType.PeerProfileEdit:
    case RouteType.PeerCreate:
    case RouteType.PeerEdit:
      return <PeerList />

    case RouteType.TokenList:
    case RouteType.TokenGenerate:
      return <TokenList />

    case RouteType.Index:
    case RouteType.ArticleList:
      return <ArticleList />

    case RouteType.CommentList:
      return <CommentList />

    case RouteType.PageList:
      return <PageList />

    case RouteType.ImageList:
    case RouteType.ImageUpload:
    case RouteType.ImageEdit:
      return <ImageList />

    case RouteType.AuthorList:
    case RouteType.AuthorCreate:
    case RouteType.AuthorEdit:
      return <AuthorList />

    case RouteType.UserList:
      return <UserList />
    case RouteType.UserCreate:
    case RouteType.UserEditView:
      return <UserEditView />

    case RouteType.SubscriptionList:
    case RouteType.SubscriptionCreate:
    case RouteType.SubscriptionEdit:
      return <SubscriptionList />

    case RouteType.UserRoleList:
    case RouteType.UserRoleCreate:
    case RouteType.UserRoleEdit:
      return <UserRoleList />

    case RouteType.MemberPlanList:
    case RouteType.MemberPlanCreate:
    case RouteType.MemberPlanEdit:
      return <MemberPlanList />

    case RouteType.PaymentMethodList:
    case RouteType.PaymentMethodCreate:
    case RouteType.PaymentMethodEdit:
      return <PaymentMethodList />

    case RouteType.NavigationList:
    case RouteType.NavigationCreate:
    case RouteType.NavigationEdit:
      return <NavigationList />

    case RouteType.PeerArticleList:
      return <PeerArticleList />

    case RouteType.SettingList:
      return <SettingList />

    case RouteType.NotFound:
      return <ArticleList />
  }

  return null
}

function GetComponents(current: any) {
  if (current) {
    switch (current.type) {
      case RouteType.Login:
        return <Login />

      case RouteType.ArticleCreate:
      case RouteType.ArticleEdit:
        return (
          <ArticleEditor
            id={current.type === RouteType.ArticleEdit ? current.params.id : undefined}
          />
        )

      case RouteType.PageCreate:
      case RouteType.PageEdit:
        return (
          <PageEditor id={current.type === RouteType.PageEdit ? current.params.id : undefined} />
        )

      default:
        return <Base>{contentForRoute(current)}</Base>
    }
  }

  return null
}
export function App() {
  const {current} = useRoute()

  const {i18n} = useTranslation()
  const [lng, setLang] = useState<Record<string, any>>(enGB)
  const currentLanguageMap = new Map<string, any>([
    ['fr', fr],
    ['en', enGB],
    ['de', de]
  ])

  i18n.on('languageChanged', lng => {
    setLang(currentLanguageMap.get(lng))
  })

  const {session} = useContext(AuthContext)
  const dispatch = useRouteDispatch()

  useEffect(() => {
    if (!session) {
      dispatch({
        type: RouteActionType.SetCurrentRoute,
        route: LoginRoute.create({})
      })
    }
  }, [session])

  return <CustomProvider locale={lng}>{GetComponents(current)}</CustomProvider>
}
export const HotApp = hot(App)
