import React from 'react'
import {hot} from 'react-hot-loader/root'

//import 'rsuite/lib/styles/index.less'

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

// import './global.less'
import {useConfigQuery} from './api'
import {EditorConfig, ContentModelConfigMerged, ExtensionConfig} from './interfaces/extensionConfig'
import {Extension} from './routes/extension'
import {ContentEditor} from './routes/contentEditor'
import {ContentList} from './routes/contentList'
import {ConfigContext} from './Editorcontext'

export function contentForRoute(route: Route, configs: EditorConfig) {
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

    case RouteType.ContentList:
      return <ContentList contentTypeList={configs} />

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
  }

  return null
}

export function App({contentModelExtension, cusomExtension}: ExtensionConfig) {
  const {current} = useRoute()
  const {data} = useConfigQuery({
    fetchPolicy: 'network-only'
  })

  if (!(current && data?.config.content)) {
    return null
  }

  const contentModelConfigMerged: ContentModelConfigMerged[] = data.config.content.map(config => {
    const editorConfig = contentModelExtension?.find(c => c.identifier === config.identifier)

    let result = config
    if (editorConfig) {
      result = Object.assign({}, result, editorConfig)
    }
    return result
  })

  const editorConfig: EditorConfig = {
    contentModelExtension: contentModelConfigMerged,
    cusomExtension: cusomExtension,
    lang: data.config.languages
  }

  let comp = null
  switch (current.type) {
    case RouteType.Login:
      comp = <Login />
      break

    case RouteType.ArticleCreate:
    case RouteType.ArticleEdit:
      comp = (
        <ArticleEditor
          id={current.type === RouteType.ArticleEdit ? current.params.id : undefined}
        />
      )
      break

    case RouteType.PageCreate:
    case RouteType.PageEdit:
      comp = <PageEditor id={current.type === RouteType.PageEdit ? current.params.id : undefined} />
      break

    case RouteType.ContentCreate:
    case RouteType.ContentEdit:
      comp = (
        <ContentEditor
          editorConfig={editorConfig}
          id={current.type === RouteType.ContentEdit ? current.params.id : undefined}
        />
      )
      break

    case RouteType.Extension:
      comp = (
        <Base contentTypeList={editorConfig}>
          <Extension configs={editorConfig} />
        </Base>
      )
      break

    default:
      comp = <Base contentTypeList={editorConfig}>{contentForRoute(current, editorConfig)}</Base>
  }
  return <ConfigContext.Provider value={editorConfig}>{comp}</ConfigContext.Provider>
}

export const HotApp = hot(App)
