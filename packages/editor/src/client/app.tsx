import 'rsuite/styles/index.less'
import './global.less'

import {gql, useMutation} from '@apollo/client'
import React, {useContext, useEffect, useState} from 'react'
import {hot} from 'react-hot-loader/root'
import {useTranslation} from 'react-i18next'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {CustomProvider} from 'rsuite'
import enGB from 'rsuite/locales/en_GB'

import {AuthContext, AuthDispatchActionType, AuthDispatchContext} from './authContext'
import {Base} from './base'
import de from './locales/rsuiteDe'
import fr from './locales/rsuiteFr'
import {Login} from './login'
import {ArticleEditor} from './routes/articleEditor'
import {ArticleList} from './routes/articleList'
import {AuthorList} from './routes/authorList'
import {CommentList} from './routes/commentList'
import {ImageList} from './routes/imageList'
import {MemberPlanList} from './routes/memberPlanList'
import {NavigationList} from './routes/navigationList'
import {PageEditor} from './routes/pageEditor'
import {PageList} from './routes/pageList'
import {PaymentMethodList} from './routes/paymentMethodList'
import {PeerArticleList} from './routes/peerArticleList'
import {PeerList} from './routes/peerList'
import {SettingList} from './routes/settingList'
import {SubscriptionList} from './routes/subscriptionList'
import {TokenList} from './routes/tokenList'
import {UserEditView} from './routes/userEditView'
import {UserList} from './routes/userList'
import {UserRoleList} from './routes/userRoleList'
import {LocalStorageKey} from './utility'

const LogoutMutation = gql`
  mutation Logout {
    revokeActiveSession
  }
`

const Logout = () => {
  const [logout] = useMutation(LogoutMutation)
  const {session} = useContext(AuthContext)
  const authDispatch = useContext(AuthDispatchContext)

  useEffect(() => {
    if (session) {
      logout().catch(error => console.warn('Error logging out ', error))
      localStorage.removeItem(LocalStorageKey.SessionToken)
      authDispatch({type: AuthDispatchActionType.Logout})
    }
  }, [session])

  return <Navigate to="/login" replace />
}

export function App() {
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
  useEffect(() => {
    if (!session && window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
  }, [])

  return (
    <CustomProvider locale={lng}>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<Login />} />
          {/* Articles Routes */}
          <Route
            path="/"
            element={
              <Base>
                <ArticleList />
              </Base>
            }
          />
          <Route
            path="articles"
            element={
              <Base>
                <ArticleList />
              </Base>
            }
          />
          <Route path="articles/create" element={<ArticleEditor />} />
          <Route path="articles/edit/:id" element={<ArticleEditor />} />
          {/* Peer Articles Routes */}
          <Route
            path="peerarticles"
            element={
              <Base>
                <PeerArticleList />
              </Base>
            }
          />
          {/* Pages Routes */}
          <Route
            path="pages"
            element={
              <Base>
                <PageList />
              </Base>
            }
          />
          <Route path="pages/create" element={<PageEditor />} />
          <Route path="pages/edit/:id" element={<PageEditor />} />
          {/* Comments Routes */}
          <Route
            path="comments"
            element={
              <Base>
                <CommentList />
              </Base>
            }
          />
          {/* Images Routes */}
          <Route
            path="images"
            element={
              <Base>
                <ImageList />
              </Base>
            }
          />
          <Route
            path="/images/upload"
            element={
              <Base>
                <ImageList />
              </Base>
            }
          />
          <Route
            path="/images/edit/:id"
            element={
              <Base>
                <ImageList />
              </Base>
            }
          />
          {/* Navigations Routes */}
          <Route
            path="navigations"
            element={
              <Base>
                <NavigationList />
              </Base>
            }
          />
          <Route
            path="navigations/create"
            element={
              <Base>
                <NavigationList />
              </Base>
            }
          />
          <Route
            path="navigations/edit/:id"
            element={
              <Base>
                <NavigationList />
              </Base>
            }
          />
          {/* Authors Routes */}
          <Route
            path="authors"
            element={
              <Base>
                <AuthorList />
              </Base>
            }
          />
          <Route
            path="authors/create"
            element={
              <Base>
                <AuthorList />
              </Base>
            }
          />
          <Route
            path="authors/edit/:id"
            element={
              <Base>
                <AuthorList />
              </Base>
            }
          />
          {/* Users Routes */}
          <Route
            path="users"
            element={
              <Base>
                <UserList />
              </Base>
            }
          />
          <Route
            path="users/create"
            element={
              <Base>
                <UserEditView />
              </Base>
            }
          />
          <Route
            path="users/edit/:id"
            element={
              <Base>
                <UserEditView />
              </Base>
            }
          />
          {/* User Roles Routes */}
          <Route
            path="userroles"
            element={
              <Base>
                <UserRoleList />
              </Base>
            }
          />
          <Route
            path="userroles/create"
            element={
              <Base>
                <UserRoleList />
              </Base>
            }
          />
          <Route
            path="userroles/edit/:id"
            element={
              <Base>
                <UserRoleList />
              </Base>
            }
          />
          {/* Subscription Routes */}
          <Route
            path="subscriptions"
            element={
              <Base>
                <SubscriptionList />
              </Base>
            }
          />
          <Route
            path="subscriptions/create"
            element={
              <Base>
                <SubscriptionList />
              </Base>
            }
          />
          <Route
            path="subscriptions/edit/:id"
            element={
              <Base>
                <SubscriptionList />
              </Base>
            }
          />
          {/* Member Plans Routes */}
          <Route
            path="memberplans"
            element={
              <Base>
                <MemberPlanList />
              </Base>
            }
          />
          <Route
            path="memberplans/create"
            element={
              <Base>
                <MemberPlanList />
              </Base>
            }
          />
          <Route
            path="memberplans/edit/:id"
            element={
              <Base>
                <MemberPlanList />
              </Base>
            }
          />
          {/* Payment Methods Routes */}
          <Route
            path="paymentmethods"
            element={
              <Base>
                <PaymentMethodList />
              </Base>
            }
          />
          <Route
            path="paymentmethods/create"
            element={
              <Base>
                <PaymentMethodList />
              </Base>
            }
          />
          <Route
            path="paymentmethods/edit/:id"
            element={
              <Base>
                <PaymentMethodList />
              </Base>
            }
          />
          {/* Peering Routes */}
          <Route
            path="peering"
            element={
              <Base>
                <PeerList />
              </Base>
            }
          />
          <Route
            path="peering/create"
            element={
              <Base>
                <PeerList />
              </Base>
            }
          />
          <Route
            path="peering/edit/:id"
            element={
              <Base>
                <PeerList />
              </Base>
            }
          />
          <Route
            path="peering/profile/edit"
            element={
              <Base>
                <PeerList />
              </Base>
            }
          />
          {/* Tokens Routes */}
          <Route
            path="tokens"
            element={
              <Base>
                <TokenList />
              </Base>
            }
          />
          <Route
            path="tokens/generate"
            element={
              <Base>
                <TokenList />
              </Base>
            }
          />
          {/* Settings Routes */}
          <Route
            path="settings"
            element={
              <Base>
                <SettingList />
              </Base>
            }
          />
          {/* Logout */}
          <Route path="logout" element={<Logout />} />
        </Routes>
      </BrowserRouter>
    </CustomProvider>
  )
}

export const HotApp = hot(App)
