import 'rsuite/styles/index.less'

import {gql, useMutation} from '@apollo/client'
import {css, Global} from '@emotion/react'
import {BannerList, CreateBannerForm, EditBannerForm} from '@wepublish/banner/editor'
import {
  ConsentCreateView,
  ConsentEditView,
  ConsentList,
  UserConsentCreateView,
  UserConsentEditView,
  UserConsentList
} from '@wepublish/consent/editor'
import {
  CreateCrowdfundingForm,
  CrowdfundingList,
  EditCrowdfundingForm
} from '@wepublish/crowdfunding/editor'
import {TagType} from '@wepublish/editor/api'
import {LocalStorageKey} from '@wepublish/editor/api-v2'
import {ImportableEventListView} from '@wepublish/event/import/editor'
import {
  MailTemplateList,
  MemberPlanEdit,
  PlaceholderList,
  SubscriptionFlowList,
  SystemMailList
} from '@wepublish/membership/editor'
import {SettingList} from '@wepublish/settings/editor'
import {AuthContext, AuthDispatchActionType, AuthDispatchContext} from '@wepublish/ui/editor'
import {useContext, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {CustomProvider} from 'rsuite'
import enGB from 'rsuite/locales/en_GB'

import {Base} from './base'
import de from './locales/rsuiteDe'
import fr from './locales/rsuiteFr'
import {Login} from './login'
import {ArticleEditor} from './routes/articles/articleEditor'
import {ArticleList} from './routes/articles/articleList'
import {AudienceDashboard} from './routes/audience/audience-dashboard'
import {AuthorList} from './routes/authors/authorList'
import {BlockStyleList} from './routes/blockStyles/blockStyleList'
import {CommentRatingEditView} from './routes/commentRatings/commentRatingEditView'
import {CommentEditView} from './routes/comments/commentEditView'
import {CommentList} from './routes/comments/commentList'
import {Dashboard} from './routes/dashboard/dashboard'
import {EventCreateView} from './routes/events/eventCreateView'
import {EventEditView} from './routes/events/eventEditView'
import {EventListView} from './routes/events/eventListView'
import {ImageList} from './routes/images/imageList'
import {MemberPlanList} from './routes/memberPlans/memberPlanList'
import {NavigationList} from './routes/navigations/navigationList'
import {PageEditor} from './routes/pages/pageEditor'
import {PageList} from './routes/pages/pageList'
import {PaymentMethodList} from './routes/paymentMethods/paymentMethodList'
import {PeerArticleList} from './routes/peerArticles/peerArticleList'
import {PeerList} from './routes/peers/peerList'
import {PollEditView} from './routes/polls/pollEditView'
import {PollList} from './routes/polls/pollList'
import {PollVoteListContainer} from './routes/polls/PollVotesListContainer'
import {SubscriptionEditView} from './routes/subscriptions/subscriptionEditView'
import {SubscriptionList} from './routes/subscriptions/subscriptionList'
import {TagList} from './routes/tags/tagList'
import {TokenList} from './routes/tokens/tokenList'
import {UserRoleList} from './routes/userRoles/userRoleList'
import {UserEditView} from './routes/users/userEditView'
import {UserList} from './routes/users/userList'

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
  }, [authDispatch, logout, session])

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
    if (session === null && window.location.pathname !== '/login') {
      window.location.href = `/login?next=${window.location.pathname}`
    }
  }, [session])

  return (
    <>
      <Global
        styles={css`
          .rs-table {
            .highlighted-row,
            .highlighted-row &-cell-group &-cell {
              background-color: #f2faff;
            }

            &-row.approved:not(&-row-header),
            &-row.approved &-cell-group,
            &-row.approved &-cell {
              background: #e1f8de;
            }

            &-row.pending-user:not(&-row-header),
            &-row.pending-user &-cell-group,
            &-row.pending-user &-cell {
              background: #f8def2;
            }

            &-row.pending-approval:not(&-row-header),
            &-row.pending-approval &-cell-group,
            &-row.pending-approval &-cell {
              background: #f8def2;
            }

            &-row.rejected:not(&-row-header),
            &-row.rejected &-cell-group,
            &-row.rejected &-cell {
              background: rgb(83, 85, 83);
              color: white;
              text-decoration: line-through;
            }

            &-hover &-row.rejected:not(&-row-header):hover,
            &-hover &-row.rejected:hover &-cell-group,
            &-hover &-row.rejected:hover &-cell {
              color: rgb(83, 85, 83);
              text-decoration: line-through;
            }
          }

          .icon-selector {
            fill: #7a7a7a;

            &:hover {
              fill: #1675e0;
            }

            svg {
              fill: inherit;
            }
          }

          .unsaved {
            .rs-badge-content {
              background: darkorange;
            }
          }

          .saved {
            .rs-badge-content {
              visibility: hidden;
            }
          }

          .displayThreeLinesOnly {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
            word-wrap: break-word;
          }

          .richTextFrame {
            padding: 0px 20px 20px;
            border: 1px solid #e5e5ea;
            border-radius: 7px;
            &:hover {
              border-color: #1675e0;
            }
          }

          .authorLinks div {
            overflow: visible;
          }

          /* overwrite the horizontal gutter of r-suite's <Row> component */
          .rs-row [class*='rs-col-'] {
            margin-bottom: 5px;
            margin-top: 5px;
          }

          .rs-sidenav-item-active,
          .rs-dropdown-item-active {
            position: relative;

            &:before {
              content: '';
              position: absolute;
              width: 4px;
              height: 100%;
              left: 0;
              top: 0;
              background-color: #1675e0;
            }
          }
        `}
      />
      <CustomProvider locale={lng}>
        <BrowserRouter>
          <Routes>
            <Route path="login" element={<Login />} />
            {/* Dashboard Routes */}
            <Route
              path="dashboard"
              element={
                <Base>
                  <Dashboard />
                </Base>
              }
            />
            <Route
              path="/"
              element={
                <Base>
                  <Dashboard />
                </Base>
              }
            />
            {/* Articles Routes */}
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
            <Route
              path="articles/peer"
              element={
                <Base>
                  <PeerArticleList />
                </Base>
              }
            />
            <Route
              path="articles/tags"
              element={
                <Base>
                  <TagList type={TagType.Article} />
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
            <Route
              path="pages/tags"
              element={
                <Base>
                  <TagList type={TagType.Page} />
                </Base>
              }
            />
            {/* BlockStyle Routes */}
            <Route
              path="block-content/styles"
              element={
                <Base>
                  <BlockStyleList />
                </Base>
              }
            />

            {/* Crowdfunding Routes */}
            <Route
              path="crowdfundings"
              element={
                <Base>
                  <CrowdfundingList />
                </Base>
              }
            />
            <Route
              path="crowdfundings/create"
              element={
                <Base>
                  <CreateCrowdfundingForm />
                </Base>
              }
            />
            <Route
              path="crowdfundings/edit/:id"
              element={
                <Base>
                  <EditCrowdfundingForm />
                </Base>
              }
            />

            {/* Poll Routes */}
            <Route
              path="polls"
              element={
                <Base>
                  <PollList />
                </Base>
              }
            />
            <Route
              path="polls/edit/:id"
              element={
                <Base>
                  <PollEditView />
                </Base>
              }
            />
            <Route
              path="polls/votes/:pollId"
              element={
                <Base>
                  <PollVoteListContainer />
                </Base>
              }
            />

            {/* Comments Routes */}
            <Route
              path="comments"
              element={
                <Base>
                  <CommentList />
                </Base>
              }
            />

            <Route
              path="comments/edit/:id"
              element={
                <Base>
                  <CommentEditView />
                </Base>
              }
            />

            <Route
              path="comments/tags"
              element={
                <Base>
                  <TagList type={TagType.Comment} />
                </Base>
              }
            />

            <Route
              path="comments/rating"
              element={
                <Base>
                  <CommentRatingEditView />
                </Base>
              }
            />

            {/* Events Routes */}
            <Route
              path="events"
              element={
                <Base>
                  <EventListView />
                </Base>
              }
            />

            <Route
              path="events/create"
              element={
                <Base>
                  <EventCreateView />
                </Base>
              }
            />

            <Route
              path="events/edit/:id"
              element={
                <Base>
                  <EventEditView />
                </Base>
              }
            />

            <Route
              path="events/tags"
              element={
                <Base>
                  <TagList type={TagType.Event} />
                </Base>
              }
            />

            <Route
              path="events/import"
              element={
                <Base>
                  <ImportableEventListView />
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
            <Route
              path="banners"
              element={
                <Base>
                  <BannerList />
                </Base>
              }
            />
            <Route
              path="banners/create"
              element={
                <Base>
                  <CreateBannerForm />
                </Base>
              }
            />
            <Route
              path="banners/edit/:id"
              element={
                <Base>
                  <EditBannerForm />
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

            <Route
              path="authors/tags"
              element={
                <Base>
                  <TagList type={TagType.Author} />
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

            {/* Audience Routes */}
            <Route
              path="audience/dashboard"
              element={
                <Base>
                  <AudienceDashboard />
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
                  <SubscriptionEditView />
                </Base>
              }
            />
            <Route
              path="subscriptions/edit/:id"
              element={
                <Base>
                  <SubscriptionEditView />
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
                  <MemberPlanEdit />
                </Base>
              }
            />
            <Route
              path="memberplans/edit/:id"
              element={
                <Base>
                  <MemberPlanEdit />
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
            {/* Consents Routes */}
            <Route
              path="consents"
              element={
                <Base>
                  <ConsentList />
                </Base>
              }
            />
            <Route
              path="consents/create"
              element={
                <Base>
                  <ConsentCreateView />
                </Base>
              }
            />
            <Route
              path="consents/edit/:id"
              element={
                <Base>
                  <ConsentEditView />
                </Base>
              }
            />
            {/* Consents Routes */}
            <Route
              path="userConsents"
              element={
                <Base>
                  <UserConsentList />
                </Base>
              }
            />
            <Route
              path="userConsents/create"
              element={
                <Base>
                  <UserConsentCreateView />
                </Base>
              }
            />
            <Route
              path="userConsents/edit/:id"
              element={
                <Base>
                  <UserConsentEditView />
                </Base>
              }
            />
            <Route
              path="communicationflows/edit/:id"
              element={
                <Base>
                  <SubscriptionFlowList />
                </Base>
              }
            />
            <Route
              path="mailtemplates"
              element={
                <Base>
                  <MailTemplateList />
                </Base>
              }
            />
            <Route
              path="mailtemplates/placeholders"
              element={
                <Base>
                  <PlaceholderList />
                </Base>
              }
            />
            <Route
              path="systemmails"
              element={
                <Base>
                  <SystemMailList />
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
    </>
  )
}
