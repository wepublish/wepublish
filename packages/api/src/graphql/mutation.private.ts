import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import {Issuer} from 'openid-client'

import {GraphQLSession, GraphQLSessionWithToken} from './session'
import {Context} from '../context'

import {
  DuplicatePageSlugError,
  InvalidCredentialsError,
  InvalidOAuth2TokenError,
  NotActiveError,
  NotFound,
  OAuth2ProviderNotFoundError,
  UserNotFoundError
} from '../error'

import {GraphQLArticle, GraphQLArticleInput} from './article'
import {Block, BlockMap, BlockType} from '../db/block'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLImage, GraphQLUpdateImageInput, GraphQLUploadImageInput} from './image'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {GraphQLPage, GraphQLPageInput} from './page'

import {GraphQLNavigation, GraphQLNavigationInput, GraphQLNavigationLinkInput} from './navigation'
import {GraphQLBlockInput, GraphQLTeaserInput} from './blocks'

import {
  authorise,
  CanCreateArticle,
  CanCreateAuthor,
  CanCreateImage,
  CanCreateInvoice,
  CanCreateMemberPlan,
  CanCreateNavigation,
  CanCreatePage,
  CanCreatePayment,
  CanCreatePaymentMethod,
  CanCreatePeer,
  CanCreateToken,
  CanCreateUser,
  CanCreateUserRole,
  CanDeleteArticle,
  CanDeleteAuthor,
  CanDeleteImage,
  CanDeleteInvoice,
  CanDeleteMemberPlan,
  CanDeleteNavigation,
  CanDeletePage,
  CanDeletePaymentMethod,
  CanDeletePeer,
  CanDeleteToken,
  CanDeleteUser,
  CanDeleteUserRole,
  CanPublishArticle,
  CanPublishPage,
  CanResetUserPassword,
  CanTakeActionOnComment,
  CanUpdatePeerProfile,
  CanSendJWTLogin,
  CanCreateSubscription,
  CanDeleteSubscription,
  CanUpdateSettings
} from './permissions'
import {GraphQLUser, GraphQLUserInput} from './user'
import {GraphQLUserRole, GraphQLUserRoleInput} from './userRole'

import {
  GraphQLCreatePeerInput,
  GraphQLPeer,
  GraphQLPeerProfile,
  GraphQLPeerProfileInput,
  GraphQLUpdatePeerInput
} from './peer'

import {GraphQLCreatedToken, GraphQLTokenInput} from './token'
import {GraphQLComment, GraphQLCommentRejectionReason} from './comment'
import {CommentState} from '../db/comment'
import {GraphQLMemberPlan, GraphQLMemberPlanInput} from './memberPlan'
import {GraphQLPaymentMethod, GraphQLPaymentMethodInput} from './paymentMethod'
import {GraphQLInvoice, GraphQLInvoiceInput} from './invoice'
import {GraphQLPayment, GraphQLPaymentFromInvoiceInput} from './payment'
import {PaymentState} from '../db/payment'
import {SendMailType} from '../mails/mailContext'
import {GraphQLSubscription, GraphQLSubscriptionInput} from './subscription'
import {GraphQLSetting, GraphQLUpdateSettingArgs} from './setting'
import {SettingName} from '../db/setting'
import {checkSettingRestrictions} from '../utility'
import {Validator} from '../validator'

function mapTeaserUnionMap(value: any) {
  if (!value) return null

  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no teaser types in ${GraphQLTeaserInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple teaser types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLTeaserInput.name
      }, they're mutually exclusive.`
    )
  }

  const type = Object.keys(value)[0] as keyof BlockMap
  const teaserValue = value[type]

  return {type, ...teaserValue} as Block
}

function mapBlockUnionMap(value: any) {
  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no block types in ${GraphQLBlockInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLBlockInput.name
      }, they're mutually exclusive.`
    )
  }

  const type = Object.keys(value)[0] as keyof BlockMap
  const blockValue = value[type]

  switch (type) {
    case BlockType.TeaserGrid:
      return {type, ...blockValue, teasers: blockValue.teasers.map(mapTeaserUnionMap)}

    case BlockType.TeaserGridFlex:
      return {
        type,
        ...blockValue,
        flexTeasers: blockValue.flexTeasers.map(({teaser, ...value}: any) => ({
          ...value,
          teaser: mapTeaserUnionMap(teaser)
        }))
      }

    default:
      return {type, ...blockValue} as Block
  }
}

function mapNavigationLinkInput(value: any) {
  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no navigation link types in ${GraphQLNavigationLinkInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple navigation link  types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLNavigationLinkInput.name
      }, they're mutually exclusive.`
    )
  }

  const key = Object.keys(value)[0] as keyof BlockMap
  return {type: key, ...value[key]} as Block
}

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Peering
    // =======

    updatePeerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      args: {input: {type: GraphQLNonNull(GraphQLPeerProfileInput)}},
      async resolve(root, {input}, {hostURL, authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanUpdatePeerProfile, roles)

        return {...(await dbAdapter.peer.updatePeerProfile(input)), hostURL}
      }
    },

    createPeer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {input: {type: GraphQLNonNull(GraphQLCreatePeerInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePeer, roles)

        // TODO: Check if valid peer?
        return dbAdapter.peer.createPeer(input)
      }
    },

    updatePeer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUpdatePeerInput)}
      },
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePeer, roles)

        // TODO: Check if valid peer?
        return dbAdapter.peer.updatePeer(id, input)
      }
    },

    deletePeer: {
      type: GraphQLID,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeletePeer, roles)

        return dbAdapter.peer.deletePeer(id)
      }
    },

    // Session
    // =======

    createSession: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {email, password}, {dbAdapter}) {
        email = email.toLowerCase()
        await Validator.login().validateAsync({email})
        const user = await dbAdapter.user.getUserForCredentials({email, password})
        if (!user) throw new InvalidCredentialsError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithJWT: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        jwt: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {jwt}, {dbAdapter, verifyJWT}) {
        const userID = verifyJWT(jwt)

        const user = await dbAdapter.user.getUserByID(userID)
        if (!user) throw new InvalidCredentialsError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithOAuth2Code: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        code: {type: GraphQLNonNull(GraphQLString)},
        redirectUri: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {name, code, redirectUri}, {dbAdapter, oauth2Providers}) {
        const provider = oauth2Providers.find(provider => provider.name === name)
        if (!provider) throw new OAuth2ProviderNotFoundError()
        const issuer = await Issuer.discover(provider.discoverUrl)
        const client = new issuer.Client({
          client_id: provider.clientId,
          client_secret: provider.clientKey,
          redirect_uris: provider.redirectUri,
          response_types: ['code']
        })
        const token = await client.callback(redirectUri, {code})
        if (!token.access_token) throw new InvalidOAuth2TokenError()
        const userInfo = await client.userinfo(token.access_token)
        if (!userInfo.email) throw new Error('UserInfo did not return an email')
        const user = await dbAdapter.user.getUser(userInfo.email)
        if (!user) throw new UserNotFoundError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    revokeSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        return dbAdapter.session.deleteUserSessionByID(user, id)
      }
    },

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const session = authenticateUser()
        return session ? await dbAdapter.session.deleteUserSessionByToken(session.token) : false
      }
    },

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      args: {},
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        return dbAdapter.session.getUserSessions(user)
      }
    },

    sendJWTLogin: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        url: {type: GraphQLNonNull(GraphQLString)},
        email: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {url, email}, {authenticate, dbAdapter, generateJWT, mailContext}) {
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)
        email = email.toLowerCase()
        await Validator.login().validateAsync({email})

        const user = await dbAdapter.user.getUser(email)
        if (!user) throw new NotFound('User', email)
        const jwtExpires =
          ((await dbAdapter.setting.getSetting(SettingName.SEND_LOGIN_JWT_EXPIRES_MIN))
            ?.value as number) ?? parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
        if (!jwtExpires) throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')
        const token = generateJWT({
          id: user.id,
          expiresInMinutes: jwtExpires
        })
        await mailContext.sendMail({
          type: SendMailType.LoginLink,
          recipient: email,
          data: {
            url: `${url}?jwt=${token}`,
            user
          }
        })
        return email
      }
    },

    sendWebsiteLogin: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(
        root,
        {url, email},
        {authenticate, dbAdapter, generateJWT, mailContext, urlAdapter}
      ) {
        email = email.toLowerCase()
        await Validator.login().validateAsync({email})
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)

        const jwtExpires =
          ((await dbAdapter.setting.getSetting(SettingName.SEND_LOGIN_JWT_EXPIRES_MIN))
            ?.value as number) ?? parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
        if (!jwtExpires) throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')

        const user = await dbAdapter.user.getUser(email)
        if (!user) throw new NotFound('User', email)
        const token = generateJWT({
          id: user.id,
          expiresInMinutes: jwtExpires
        })
        await mailContext.sendMail({
          type: SendMailType.LoginLink,
          recipient: email,
          data: {
            url: urlAdapter.getLoginURL(token),
            user
          }
        })
        return email
      }
    },

    // Token
    // =====

    createToken: {
      type: GraphQLNonNull(GraphQLCreatedToken),
      args: {input: {type: GraphQLNonNull(GraphQLTokenInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateToken, roles)

        // TODO: Receive roleIDs from input
        return dbAdapter.token.createToken({...input, roleIDs: ['peer']})
      }
    },

    deleteToken: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteToken, roles)

        return dbAdapter.token.deleteToken(id)
      }
    },

    // User
    // ====

    createUser: {
      type: GraphQLUser,
      args: {
        input: {type: GraphQLNonNull(GraphQLUserInput)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {input, password}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUser, roles)
        input.email = input.email.toLowerCase()
        await Validator.createUser().validateAsync(input, {allowUnknown: true})
        return dbAdapter.user.createUser({input, password})
      }
    },

    updateUser: {
      type: GraphQLUser,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUserInput)}
      },
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUser, roles)
        input.email = input.email.toLowerCase()
        await Validator.createUser().validateAsync(input, {allowUnknown: true})
        return dbAdapter.user.updateUser({id, input})
      }
    },

    resetUserPassword: {
      type: GraphQLUser,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        password: {type: GraphQLNonNull(GraphQLString)},
        sendMail: {type: GraphQLBoolean}
      },
      async resolve(root, {id, password, sendMail}, {authenticate, mailContext, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanResetUserPassword, roles)
        const user = await dbAdapter.user.resetUserPassword({id, password})
        if (sendMail && user) {
          await mailContext.sendMail({
            type: SendMailType.PasswordReset,
            recipient: user.email,
            data: {
              user
            }
          })
        }
        return user
      }
    },

    deleteUser: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteUser, roles)
        await dbAdapter.user.deleteUser({id})
        return id
      }
    },

    // Subscriptions
    // ====

    createSubscription: {
      type: GraphQLSubscription,
      args: {
        input: {type: GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      async resolve(root, {input}, {authenticate, dbAdapter, memberContext}) {
        const {roles} = authenticate()
        authorise(CanCreateSubscription, roles)

        const subscription = await dbAdapter.subscription.createSubscription({input})
        if (!subscription) throw new Error('Subscription not created.')

        // create invoice
        const userId = subscription.userID
        const user = await dbAdapter.user.getUserByID(userId)
        if (!user) throw new Error('User of subscription not found.')

        // instantly create a new invoice fo the user
        await memberContext.renewSubscriptionForUser({subscription})
        return subscription
      }
    },

    updateSubscription: {
      type: GraphQLSubscription,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      async resolve(root, {id, input}, {authenticate, dbAdapter, memberContext}) {
        const {roles} = authenticate()
        authorise(CanCreateSubscription, roles)

        const user = await dbAdapter.user.getUserByID(input.userID)
        if (!user) throw new Error('Can not update subscription without user')

        const updatedSubscription = await dbAdapter.subscription.updateSubscription({id, input})
        if (!updatedSubscription) throw new NotFound('subscription', id)

        // cancel open invoices if subscription is deactivated
        if (input.deactivation !== null) {
          await memberContext.cancelInvoicesForSubscription(id)
        }

        return await memberContext.handleSubscriptionChange({
          subscription: updatedSubscription
        })
      }
    },

    deleteSubscription: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteSubscription, roles)

        await dbAdapter.subscription.deleteSubscription({id})
        return id
      }
    },

    // UserRole
    // ====

    createUserRole: {
      type: GraphQLUserRole,
      args: {input: {type: GraphQLNonNull(GraphQLUserRoleInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUserRole, roles)
        return dbAdapter.userRole.createUserRole({input})
      }
    },

    updateUserRole: {
      type: GraphQLUserRole,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUserRoleInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUserRole, roles)
        return dbAdapter.userRole.updateUserRole({id, input})
      }
    },

    deleteUserRole: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteUserRole, roles)
        await dbAdapter.userRole.deleteUserRole({id})
        return id
      }
    },

    // Navigation
    // ==========

    createNavigation: {
      type: GraphQLNavigation,
      args: {input: {type: GraphQLNonNull(GraphQLNavigationInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateNavigation, roles)

        return dbAdapter.navigation.createNavigation({
          input: {...input, links: input.links.map(mapNavigationLinkInput)}
        })
      }
    },

    updateNavigation: {
      type: GraphQLNavigation,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLNavigationInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateNavigation, roles)

        return dbAdapter.navigation.updateNavigation({
          id,
          input: {...input, links: input.links.map(mapNavigationLinkInput)}
        })
      }
    },

    deleteNavigation: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteNavigation, roles)
        return await dbAdapter.navigation.deleteNavigation({id})
      }
    },

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLAuthorInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateAuthor, roles)
        return dbAdapter.author.createAuthor({input})
      }
    },

    updateAuthor: {
      type: GraphQLAuthor,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLAuthorInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateAuthor, roles)
        return dbAdapter.author.updateAuthor({id, input})
      }
    },

    deleteAuthor: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteAuthor, roles)
        await dbAdapter.author.deleteAuthor({id})
        return id
      }
    },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: {input: {type: GraphQLNonNull(GraphQLUploadImageInput)}},
      async resolve(root, {input}, {authenticate, mediaAdapter, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateImage, roles)

        const {file, filename, title, description, tags, source, link, license, focalPoint} = input

        const {id, ...image} = await mediaAdapter.uploadImage(file)

        return dbAdapter.image.createImage({
          id,
          input: {
            ...image,

            filename: filename ?? image.filename,
            title,
            description,
            tags,

            source,
            link,
            license,

            focalPoint
          }
        })
      }
    },

    updateImage: {
      type: GraphQLImage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUpdateImageInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateImage, roles)
        return dbAdapter.image.updateImage({id, input})
      }
    },

    deleteImage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, mediaAdapter, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteImage, roles)

        await mediaAdapter.deleteImage(id)
        return dbAdapter.image.deleteImage({id})
      }
    },

    // Article
    // =======

    createArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {input: {type: GraphQLNonNull(GraphQLArticleInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateArticle, roles)

        return dbAdapter.article.createArticle({
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    updateArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLArticleInput)}
      },
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateArticle, roles)

        return dbAdapter.article.updateArticle({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deleteArticle: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteArticle, roles)
        return dbAdapter.article.deleteArticle({id})
      }
    },

    publishArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      async resolve(root, {id, publishAt, updatedAt, publishedAt}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishArticle, roles)

        return dbAdapter.article.publishArticle({
          id,
          publishAt,
          updatedAt,
          publishedAt
        })
      }
    },

    unpublishArticle: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishArticle, roles)
        return dbAdapter.article.unpublishArticle({id})
      }
    },

    duplicateArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {dbAdapter, loaders}) {
        const article = await loaders.articles.load(id)

        if (!article) throw new NotFound('article', id)

        const articleRevision = Object.assign(
          {},
          article.draft ?? article.pending ?? article.published,
          {
            slug: '',
            publishedAt: undefined,
            updatedAt: undefined
          }
        )

        const output = await dbAdapter.article.createArticle({
          input: {shared: article.shared, ...articleRevision}
        })

        return output
      }
    },

    // Page
    // =======

    createPage: {
      type: GraphQLNonNull(GraphQLPage),
      args: {input: {type: GraphQLNonNull(GraphQLPageInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePage, roles)

        return dbAdapter.page.createPage({
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    updatePage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPageInput)}
      },
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePage, roles)

        return dbAdapter.page.updatePage({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deletePage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeletePage, roles)
        return dbAdapter.page.deletePage({id})
      }
    },

    publishPage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      async resolve(
        root,
        {id, publishAt, updatedAt, publishedAt},
        {authenticate, dbAdapter, loaders}
      ) {
        const {roles} = authenticate()
        authorise(CanPublishPage, roles)

        const page = await loaders.pages.load(id)

        if (!page) throw new NotFound('page', id)
        if (!page.draft) return null

        const publishedPage = await loaders.publicPagesBySlug.load(page.draft.slug)
        if (publishedPage && publishedPage.id !== id)
          throw new DuplicatePageSlugError(publishedPage.id, publishedPage.slug)

        return dbAdapter.page.publishPage({
          id,
          publishAt,
          updatedAt,
          publishedAt
        })
      }
    },

    unpublishPage: {
      type: GraphQLPage,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishPage, roles)
        return dbAdapter.page.unpublishPage({id})
      }
    },

    duplicatePage: {
      type: GraphQLNonNull(GraphQLPage),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {dbAdapter, loaders}) {
        const page = await loaders.pages.load(id)

        if (!page) throw new NotFound('page', id)

        const pageRevision = Object.assign({}, page.draft ?? page.pending ?? page.published, {
          slug: '',
          publishedAt: undefined,
          updatedAt: undefined
        })
        const output = await dbAdapter.page.createPage({input: {...pageRevision}})

        return output
      }
    },

    // MemberPlan
    // ======

    createMemberPlan: {
      type: GraphQLMemberPlan,
      args: {input: {type: GraphQLNonNull(GraphQLMemberPlanInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateMemberPlan, roles)

        if (input.minimumDuration < 0) {
          throw new Error('Input.minimumDuration can not be < 0')
        } else if (input.pricePerMonthMinimum > input.pricePerMonthMaximum) {
          throw new Error('Input.pricePerMonthMinimum can not be > pricePerMonthMaximum')
        }

        return dbAdapter.memberPlan.createMemberPlan({input})
      }
    },

    updateMemberPlan: {
      type: GraphQLMemberPlan,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLMemberPlanInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateMemberPlan, roles)
        return dbAdapter.memberPlan.updateMemberPlan({id, input})
      }
    },

    deleteMemberPlan: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteMemberPlan, roles)
        await dbAdapter.memberPlan.deleteMemberPlan({id})
        return id
      }
    },

    // PaymentMethod
    // ======

    createPaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        input: {type: GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePaymentMethod, roles)

        // TODO: check if payment method exists and is active

        return dbAdapter.paymentMethod.createPaymentMethod({input})
      }
    },

    updatePaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePaymentMethod, roles)

        // TODO: check if payment method exists and is active

        return dbAdapter.paymentMethod.updatePaymentMethod({id, input})
      }
    },

    deletePaymentMethod: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeletePaymentMethod, roles)
        await dbAdapter.paymentMethod.deletePaymentMethod(id)
        return id
      }
    },

    // Invoice
    // ======

    createInvoice: {
      type: GraphQLInvoice,
      args: {input: {type: GraphQLNonNull(GraphQLInvoiceInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateInvoice, roles)
        return dbAdapter.invoice.createInvoice({input})
      }
    },

    createPaymentFromInvoice: {
      type: GraphQLPayment,
      args: {input: {type: GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}},
      async resolve(root, {input}, {authenticate, loaders, paymentProviders, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePayment, roles)
        const {invoiceID, paymentMethodID, successURL, failureURL} = input
        const paymentMethod = await loaders.paymentMethodsByID.load(paymentMethodID)
        const paymentProvider = paymentProviders.find(
          pp => pp.id === paymentMethod?.paymentProviderID
        )

        const invoice = await loaders.invoicesByID.load(invoiceID)

        if (!invoice || !paymentProvider) {
          throw new Error('Invalid data') // TODO: better error handling
        }

        const payment = await dbAdapter.payment.createPayment({
          input: {
            paymentMethodID,
            invoiceID,
            state: PaymentState.Created
          }
        })

        const intent = await paymentProvider.createIntent({
          paymentID: payment.id,
          invoice,
          saveCustomer: true,
          successURL,
          failureURL
        })

        return await dbAdapter.payment.updatePayment({
          id: payment.id,
          input: {
            state: intent.state,
            intentID: intent.intentID,
            intentData: intent.intentData,
            intentSecret: intent.intentSecret,
            paymentData: intent.paymentData,
            paymentMethodID: payment.paymentMethodID,
            invoiceID: payment.invoiceID
          }
        })
      }
    },

    updateInvoice: {
      type: GraphQLInvoice,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLInvoiceInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateInvoice, roles)
        return dbAdapter.invoice.updateInvoice({id, input})
      }
    },

    deleteInvoice: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteInvoice, roles)
        return await dbAdapter.invoice.deleteInvoice({id})
      }
    },

    approveComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanTakeActionOnComment, roles)

        return await dbAdapter.comment.takeActionOnComment({
          id,
          state: CommentState.Approved
        })
      }
    },

    rejectComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)}
      },
      async resolve(root, {id, rejectionReason}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanTakeActionOnComment, roles)

        return await dbAdapter.comment.takeActionOnComment({
          id,
          state: CommentState.Rejected,
          rejectionReason
        })
      }
    },

    requestChangesOnComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)}
      },
      async resolve(root, {id, rejectionReason}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanTakeActionOnComment, roles)

        return await dbAdapter.comment.takeActionOnComment({
          id,
          state: CommentState.PendingUserChanges,
          rejectionReason
        })
      }
    },

    // Settings
    // ==========

    updateSettingList: {
      type: GraphQLList(GraphQLSetting),
      args: {
        value: {type: GraphQLList(GraphQLUpdateSettingArgs)}
      },
      async resolve(root, {value}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanUpdateSettings, roles)

        for (const {name, value: newVal} of value) {
          const fullSetting = await dbAdapter.setting.getSetting(name)
          if (!fullSetting) {
            throw new NotFound('setting', name)
          }
          const currentVal = fullSetting.value
          const restriction = fullSetting.settingRestriction
          checkSettingRestrictions(newVal, currentVal, restriction)
        }

        return await dbAdapter.setting.updateSettingList(value)
      }
    }
  }

  // Image
  // =====
})
