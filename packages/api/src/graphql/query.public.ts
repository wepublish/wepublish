import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../context'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {GraphQLSlug} from './slug'
import {UserInputError} from 'apollo-server-express'
import {GraphQLPublicNavigation} from './navigation'
import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort
} from './author'
import {AuthorSort} from '../db/author'
import {GraphQLSortOrder} from './common'
import {InputCursor, Limit, SortOrder} from '../db/common'
import {
  GraphQLPublicArticle,
  GraphQLPublicArticleConnection,
  GraphQLPublicArticleFilter,
  GraphQLPublicArticleSort
} from './article'
import {SessionType} from '../db/session'
import {ArticleSort, PublicArticle} from '../db/article'
import {delegateToPeerSchema} from '../utility'
import {
  GraphQLPublicPage,
  GraphQLPublicPageConnection,
  GraphQLPublishedPageFilter,
  GraphQLPublishedPageSort
} from './page'
import {PageSort, PublicPage} from '../db/page'
import {
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort,
  GraphQLPublicMemberPlan,
  GraphQLPublicMemberPlanConnection
} from './memberPlan'
import {MemberPlanSort} from '../db/memberPlan'
import {GraphQLPublicUser} from './user'
import {GraphQLPublicInvoice} from './invoice'
import {GraphQLAuthProvider} from './auth'
import {logger} from '../server'
import {DisabledPeerError, NotFound} from '../error'
import {Invoice} from '../db/invoice'
import {GraphQLPublicSubscription} from './subscription'
import {GraphQLChallenge} from './challenge'

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Settings
    // ========

    peerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      description: 'This query returns the peer profile.',
      async resolve(root, args, {hostURL, websiteURL, dbAdapter}) {
        return {...(await dbAdapter.peer.getPeerProfile()), hostURL, websiteURL}
      }
    },

    peer: {
      type: GraphQLPeer,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      description: 'This query takes either the ID or the slug and returns the peer profile.',
      async resolve(root, {id, slug}, {loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        const peer = id ? await loaders.peer.load(id) : await loaders.peerBySlug.load(slug)

        if (peer?.isDisabled) {
          throw new DisabledPeerError()
        }
        return peer
      }
    },

    // Navigation
    // ==========

    navigation: {
      type: GraphQLPublicNavigation,
      args: {id: {type: GraphQLID}, key: {type: GraphQLID}},
      description: 'This query takes either the ID or the key and returns the navigation.',
      resolve(root, {id, key}, {authenticateUser, loaders}) {
        if ((id == null && key == null) || (id != null && key != null)) {
          throw new UserInputError('You must provide either `id` or `key`.')
        }

        return id ? loaders.navigationByID.load(id) : loaders.navigationByKey.load(key)
      }
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      description: 'This query takes either the ID or the slug and returns the author.',
      resolve(root, {id, slug}, {authenticateUser, loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.authorsByID.load(id) : loaders.authorsBySlug.load(slug)
      }
    },

    authors: {
      type: GraphQLNonNull(GraphQLAuthorConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query is to get the authors.',
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.author.getAuthors({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Article
    // =======

    article: {
      type: GraphQLPublicArticle,
      args: {
        id: {type: GraphQLID},
        slug: {type: GraphQLSlug},
        token: {type: GraphQLString}
      },
      description: 'This query takes either the ID, slug or token and returns the article.',
      async resolve(root, {id, slug, token}, {session, loaders, dbAdapter, verifyJWT}) {
        let article = id ? await loaders.publicArticles.load(id) : null

        if (!article && slug) {
          article = await dbAdapter.article.getPublishedArticleBySlug(slug)
        }
        if (!article && token) {
          try {
            const articleId = verifyJWT(token)
            const privateArticle = await loaders.articles.load(articleId)

            article = privateArticle?.draft
              ? ({
                  id: privateArticle.id,
                  shared: privateArticle.shared,
                  ...privateArticle.draft,
                  updatedAt: new Date(),
                  publishedAt: new Date()
                } as PublicArticle)
              : null
          } catch (error) {
            logger('graphql-query').warn(
              error as Error,
              'Error while verifying token with article id.'
            )
          }
        }

        if (session?.type === SessionType.Token) {
          return article?.shared ? article : null
        }
        if (!article) throw new NotFound('Article', id ?? slug ?? token)

        return article
      }
    },

    articles: {
      type: GraphQLNonNull(GraphQLPublicArticleConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPublicArticleFilter},
        sort: {type: GraphQLPublicArticleSort, defaultValue: ArticleSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the articles.',
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.article.getPublishedArticles({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Peer Article
    // ============

    peerArticle: {
      type: GraphQLPublicArticle,
      args: {
        peerID: {type: GraphQLID},
        peerSlug: {type: GraphQLSlug},
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      description: 'This query takes either the peer ID or the peer slug and returns the article.',
      async resolve(root, {peerID, peerSlug, id}, context, info) {
        const {loaders} = context

        if ((peerID == null && peerSlug == null) || (peerID != null && peerSlug != null)) {
          throw new UserInputError('You must provide either `peerID` or `peerSlug`.')
        }
        if (peerSlug) {
          const peer = await loaders.peerBySlug.load(peerSlug)

          if (peer) {
            peerID = peer.id
            loaders.peer.prime(peer.id, peer)
          }
        }

        if (!peerID) return null

        return delegateToPeerSchema(peerID, false, context, {
          fieldName: 'article',
          args: {id},
          info
        })
      }
    },

    // Page
    // =======

    page: {
      type: GraphQLPublicPage,
      args: {
        id: {type: GraphQLID},
        slug: {type: GraphQLSlug},
        token: {type: GraphQLString}
      },
      description: 'This query takes either the ID, slug or token and returns the page.',
      async resolve(root, {id, slug, token}, {session, loaders, verifyJWT}) {
        let page = id ? await loaders.publicPagesByID.load(id) : null

        if (!page && slug !== undefined) {
          // slug can be empty string
          page = await loaders.publicPagesBySlug.load(slug)
        }

        if (!page && token) {
          try {
            const pageId = verifyJWT(token)
            const privatePage = await loaders.pages.load(pageId)

            page = privatePage?.draft
              ? ({
                  id: privatePage.id,
                  ...privatePage.draft,
                  updatedAt: new Date(),
                  publishedAt: new Date()
                } as PublicPage)
              : null
          } catch (error) {
            logger('graphql-query').warn(
              error as Error,
              'Error while verifying token with page id.'
            )
          }
        }
        if (!page) throw new NotFound('Page', id ?? slug ?? token)

        return page
      }
    },

    pages: {
      type: GraphQLNonNull(GraphQLPublicPageConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPublishedPageFilter},
        sort: {type: GraphQLPublishedPageSort, defaultValue: PageSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the pages.',
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.page.getPublishedPages({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Auth
    // =======

    authProviders: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthProvider))),
      args: {redirectUri: {type: GraphQLString}},
      description: 'This query returns the redirect Uri.',
      async resolve(root, {redirectUri}, {getOauth2Clients}) {
        const clients = await getOauth2Clients()
        return clients.map(client => {
          const url = client.client.authorizationUrl({
            scope: client.provider.scopes.join(),
            response_mode: 'query',
            redirect_uri: `${redirectUri}/${client.name}`,
            state: 'fakeRandomString'
          })
          return {
            name: client.name,
            url
          }
        })
      }
    },

    // User
    // ====

    me: {
      type: GraphQLPublicUser,
      description: 'This query returns the user.',
      resolve(root, args, {session}) {
        return session?.type === SessionType.User ? session.user : null
      }
    },

    invoices: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicInvoice))),
      description: 'This query returns the invoices  of the authenticated user.',
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()

        const subscriptions = await dbAdapter.subscription.getSubscriptionsByUserID(user.id)

        const invoices: Invoice[] = []

        for (const subscription of subscriptions) {
          if (!subscription) continue
          const subscriptionInvoices = await dbAdapter.invoice.getInvoicesBySubscriptionID(
            subscription.id
          )
          for (const invoice of subscriptionInvoices) {
            if (!invoice) continue
            invoices.push(invoice)
          }
        }
        return invoices
      }
    },

    subscriptions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicSubscription))),
      description: 'This query returns the subscriptions of the authenticated user.',
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()

        return await dbAdapter.subscription.getSubscriptionsByUserID(user.id)
      }
    },

    memberPlan: {
      type: GraphQLPublicMemberPlan,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      description: 'This query returns a member plan.',
      resolve(root, {id, slug}, {loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id
          ? loaders.activeMemberPlansByID.load(id)
          : loaders.activeMemberPlansBySlug.load(slug)
      }
    },

    memberPlans: {
      type: GraphQLNonNull(GraphQLPublicMemberPlanConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLMemberPlanFilter},
        sort: {type: GraphQLMemberPlanSort, defaultValue: MemberPlanSort.CreatedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      description: 'This query returns the member plans.',
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.memberPlan.getActiveMemberPlans({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    checkInvoiceStatus: {
      type: GraphQLPublicInvoice,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      description:
        'This mutation will check the invoice status and update with information from the paymentProvider',
      async resolve(root, {id}, context) {
        const {authenticateUser, dbAdapter, paymentProviders} = context
        const {user} = authenticateUser()

        const invoice = await dbAdapter.invoice.getInvoiceByID(id)
        if (!invoice) throw new NotFound('Invoice', id)
        const subscription = await dbAdapter.subscription.getSubscriptionByID(
          invoice.subscriptionID
        )
        if (!subscription || subscription.userID !== user.id) throw new NotFound('Invoice', id)

        const payments = await dbAdapter.payment.getPaymentsByInvoiceID(invoice.id)
        const paymentMethods = await dbAdapter.paymentMethod.getActivePaymentMethods()

        for (const payment of payments) {
          if (!payment || !payment.intentID) continue

          const paymentMethod = paymentMethods.find(pm => pm.id === payment.paymentMethodID)
          if (!paymentMethod) continue // TODO: what happens if we don't find a paymentMethod

          const paymentProvider = paymentProviders.find(
            pp => pp.id === paymentMethod.paymentProviderID
          )
          if (!paymentProvider) continue // TODO: what happens if we don't find a paymentProvider

          const intentState = await paymentProvider.checkIntentStatus({intentID: payment.intentID})
          await paymentProvider.updatePaymentWithIntentState({
            intentState,
            dbAdapter: context.dbAdapter,
            loaders: context.loaders
          })
        }

        // FIXME: We need to implement a way to wait for all the database
        //  event hooks to finish before we return data. Will be solved in WPC-498
        await new Promise(resolve => setTimeout(resolve, 100))
        return await dbAdapter.invoice.getInvoiceByID(id)
      }
    },

    // Challenge
    // =======
    challenge: {
      type: GraphQLNonNull(GraphQLChallenge),
      description:
        'This query generates a challenge which can be used to access protected endpoints.',
      async resolve(_, {input}, {challenge}) {
        const c = await challenge.generateChallenge()
        return {
          challenge: c.challenge,
          challengeID: c.challengeID,
          validUntil: c.validUntil
        }
      }
    }
  }
})
