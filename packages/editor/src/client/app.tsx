import {hot} from 'react-hot-loader/root'
import React from 'react'

import 'rsuite/lib/styles/index.less'

import {useRoute, RouteType, Route} from './route'

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
import {NavigationList} from './routes/navigationList'
// import {OrganisationList} from './routes/organisationList'

import './global.less'

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
    case RouteType.UserCreate:
    case RouteType.UserEdit:
      return <UserList />

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

    case RouteType.NotFound:
      return <ArticleList />

    // case RouteType.OrganisationList:
    // case RouteType.OrganisationCreate:
    // case RouteType.OrganisationEdit:
    //   return <OrganisationList />
  }

  return null
}

export function App() {
  const {current} = useRoute()

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

export const HotApp = hot(App)
