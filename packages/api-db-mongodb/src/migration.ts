import {Db} from 'mongodb'
import {CollectionName, DBInvoice, DBPaymentMethod, DBUser} from './db/schema'
import {
  ArticleBlock,
  BlockType,
  CreateSettingArgs,
  PageBlock,
  PaymentProviderCustomer,
  SettingName,
  Subscription,
  SubscriptionDeactivationReason
} from '@wepublish/api'
import {slugify} from './utility'

export interface Migration {
  readonly version: number

  migrate(adapter: Db, locale: string): Promise<void>
}

const SessionDocumentTTL = 60 * 60 * 24 // 24h

export const Migrations: Migration[] = [
  {
    version: 0,
    async migrate(db, locale) {
      const migrations = await db.createCollection(CollectionName.Migrations, {strict: true})

      await migrations.createIndex({name: 1}, {unique: true})

      const users = await db.createCollection(CollectionName.Users, {
        strict: true
      })

      await users.createIndex({email: 1}, {unique: true})

      const sessions = await db.createCollection(CollectionName.Sessions, {
        strict: true
      })

      await sessions.createIndex({userID: 1})
      await sessions.createIndex({token: 1}, {unique: true})
      await sessions.createIndex({expiresAt: 1}, {expireAfterSeconds: SessionDocumentTTL})

      const navigations = await db.createCollection(CollectionName.Navigations, {strict: true})

      await navigations.createIndex({createdAt: -1})
      await navigations.createIndex({modifiedAt: -1})
      await navigations.createIndex({name: 1})
      await navigations.createIndex({key: 1}, {unique: true})

      const authors = await db.createCollection(CollectionName.Authors, {strict: true})

      await authors.createIndex({createdAt: -1})
      await authors.createIndex({modifiedAt: -1})
      await authors.createIndex({name: 1})
      await authors.createIndex({slug: 1}, {unique: true})

      const images = await db.createCollection(CollectionName.Images, {strict: true})

      await images.createIndex({createdAt: -1})
      await images.createIndex({modifiedAt: -1})
      await images.createIndex({title: 1})
      await images.createIndex({tags: 1}, {collation: {locale, strength: 2}})

      const articles = await db.createCollection(CollectionName.Articles, {
        strict: true
      })

      await articles.createIndex({createdAt: -1})
      await articles.createIndex({modifiedAt: -1})

      await articles.createIndex({'published.publishedAt': -1})
      await articles.createIndex({'published.updatedAt': -1})
      await articles.createIndex({'pending.publishAt': -1})

      await articles.createIndex({'draft.tags': 1}, {collation: {locale, strength: 2}})
      await articles.createIndex({'pending.tags': 1}, {collation: {locale, strength: 2}})
      await articles.createIndex({'published.tags': 1}, {collation: {locale, strength: 2}})

      await db.createCollection(CollectionName.ArticlesHistory, {
        strict: true
      })

      const pages = await db.createCollection(CollectionName.Pages, {
        strict: true
      })

      await pages.createIndex({createdAt: -1})
      await pages.createIndex({modifiedAt: -1})

      await pages.createIndex({'published.publishedAt': -1})
      await pages.createIndex({'published.updatedAt': -1})
      await pages.createIndex({'pending.publishAt': -1})

      await pages.createIndex({'draft.tags': 1}, {collation: {locale, strength: 2}})
      await pages.createIndex({'pending.tags': 1}, {collation: {locale, strength: 2}})
      await pages.createIndex({'published.tags': 1}, {collation: {locale, strength: 2}})

      await db.createCollection(CollectionName.PagesHistory, {
        strict: true
      })
    }
  },
  {
    //  Fix incorrect migration index. Add user roles, Add name and roleIDs to users.
    version: 1,
    async migrate(db, locale) {
      const migrations = db.collection(CollectionName.Migrations)

      await migrations.dropIndex('name_1')
      await migrations.createIndex({version: 1}, {unique: true})

      const userRoles = await db.createCollection(CollectionName.UserRoles, {
        strict: true
      })

      await userRoles.createIndex({name: 1}, {unique: true})

      await userRoles.insertMany([
        {
          _id: 'admin',
          createdAt: new Date(),
          modifiedAt: new Date(),
          systemRole: true,
          name: 'Admin',
          description: 'Administrator Role',
          permissionIDs: []
        },
        {
          _id: 'editor',
          createdAt: new Date(),
          modifiedAt: new Date(),
          systemRole: true,
          name: 'Editor',
          description: 'Editor Role',
          permissionIDs: []
        }
      ])

      const user = db.collection(CollectionName.Users)

      await user.updateMany({}, [
        {
          $set: {
            name: '$email',
            roleIDs: ['admin']
          }
        }
      ])
    }
  },
  {
    // Add peering and token collections and migrate ArticleTeaserGridBlock to TeaserGridBlock.
    version: 2,
    async migrate(db) {
      const userRoles = db.collection(CollectionName.UserRoles)

      await userRoles.insertOne({
        _id: 'peer',
        createdAt: new Date(),
        modifiedAt: new Date(),
        systemRole: true,
        name: 'Peer',
        description: 'Peer Role',
        permissionIDs: []
      })

      await db.createCollection(CollectionName.PeerProfiles, {strict: true})

      const peers = await db.createCollection(CollectionName.Peers, {strict: true})

      await peers.createIndex({slug: 1}, {unique: true})

      const tokens = await db.createCollection(CollectionName.Tokens, {
        strict: true
      })

      await tokens.createIndex({name: 1}, {unique: true})

      const filter = {
        $or: [
          {'draft.blocks.type': 'articleTeaserGrid'},
          {'published.blocks.type': 'articleTeaserGrid'},
          {'pending.blocks.type': 'articleTeaserGrid'}
        ]
      }

      function mapArticleTeaserGridBlock(block: any) {
        if (block.type === 'articleTeaserGrid') {
          return {
            type: 'teaserGrid',
            teasers: block.teasers.map((teaser: any) =>
              teaser
                ? {
                    type: 'article',
                    style: 'default',
                    articleID: teaser.articleID
                  }
                : null
            ),
            numColumns: block.numColumns
          }
        }

        return block
      }

      const articles = db.collection(CollectionName.Articles)
      const migrationArticles = await articles.find(filter).toArray()

      for (const article of migrationArticles) {
        if (article.draft) {
          article.draft.blocks = article.draft.blocks.map(mapArticleTeaserGridBlock)
        }

        if (article.pending) {
          article.pending.blocks = article.pending.blocks.map(mapArticleTeaserGridBlock)
        }

        if (article.published) {
          article.published.blocks = article.published.blocks.map(mapArticleTeaserGridBlock)
        }

        await articles.findOneAndReplace({_id: article._id}, article)
      }

      const pages = db.collection(CollectionName.Pages)
      const migrationPages = await pages.find(filter).toArray()

      for (const page of migrationPages) {
        if (page.draft) {
          page.draft.blocks = page.draft.blocks.map(mapArticleTeaserGridBlock)
        }

        if (page.pending) {
          page.pending.blocks = page.pending.blocks.map(mapArticleTeaserGridBlock)
        }

        if (page.published) {
          page.published.blocks = page.published.blocks.map(mapArticleTeaserGridBlock)
        }

        await pages.findOneAndReplace({_id: page._id}, page)
      }
    }
  },
  {
    // Add peering and token collections and migrate ArticleTeaserGridBlock to TeaserGridBlock.
    version: 3,
    async migrate(db) {
      const articles = db.collection(CollectionName.Articles)
      const migrationArticles = await articles.find().toArray()

      for (const article of migrationArticles) {
        if (article.draft) {
          article.draft.properties = []
        }

        if (article.pending) {
          article.pending.properties = []
        }

        if (article.published) {
          article.published.properties = []
        }

        await articles.findOneAndReplace({_id: article._id}, article)
      }

      const pages = db.collection(CollectionName.Pages)
      const migrationPages = await pages.find().toArray()

      for (const page of migrationPages) {
        if (page.draft) {
          page.draft.properties = []
        }

        if (page.pending) {
          page.pending.properties = []
        }

        if (page.published) {
          page.published.properties = []
        }

        await pages.findOneAndReplace({_id: page._id}, page)
      }
    }
  },
  {
    // Add RTE to page break block if not exists in articles and pages
    version: 4,
    async migrate(db) {
      await db.collection(CollectionName.Articles).updateMany(
        {'draft.blocks': {$elemMatch: {type: 'linkPageBreak', richText: {$exists: false}}}},
        {
          $set: {
            'draft.blocks.$[elem].richText': [{children: [{text: ''}], type: 'paragraph'}]
          }
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          'published.blocks': {
            $elemMatch: {type: 'linkPageBreak', richText: {$exists: false}}
          }
        },
        {
          $set: {'published.blocks.$[elem].richText': [{children: [{text: ''}], type: 'paragraph'}]}
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          'pending.blocks': {$elemMatch: {type: 'linkPageBreak', richText: {$exists: false}}}
        },
        {$set: {'pending.blocks.$[elem].richText': [{children: [{text: ''}], type: 'paragraph'}]}},
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )

      // Add RTE to page break block if not exists in pages
      await db.collection(CollectionName.Pages).updateMany(
        {'draft.blocks': {$elemMatch: {type: 'linkPageBreak', richText: {$exists: false}}}},
        {
          $set: {
            'draft.blocks.$[elem].richText': [{children: [{text: ''}], type: 'paragraph'}]
          }
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Pages).updateMany(
        {
          'published.blocks': {
            $elemMatch: {type: 'linkPageBreak', richText: {$exists: false}}
          }
        },
        {
          $set: {'published.blocks.$[elem].richText': [{children: [{text: ''}], type: 'paragraph'}]}
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Pages).updateMany(
        {'pending.blocks': {$elemMatch: {type: 'linkPageBreak', richText: {$exists: false}}}},
        {
          $set: {'pending.blocks.$[elem].richText': [{children: [{text: ''}], type: 'paragraph'}]}
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
    }
  },
  {
    // Add hideButton false to pageBreakBlocks
    version: 5,
    async migrate(db) {
      await db.collection(CollectionName.Articles).updateMany(
        {'draft.blocks': {$elemMatch: {type: 'linkPageBreak', hideButton: {$exists: false}}}},
        {
          $set: {
            'draft.blocks.$[elem].hideButton': false
          }
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          'published.blocks': {
            $elemMatch: {type: 'linkPageBreak', hideButton: {$exists: false}}
          }
        },
        {
          $set: {'published.blocks.$[elem].hideButton': false}
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          'pending.blocks': {$elemMatch: {type: 'linkPageBreak', hideButton: {$exists: false}}}
        },
        {$set: {'pending.blocks.$[elem].hideButton': false}},
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )

      // Add RTE to page break block if not exists in pages
      await db.collection(CollectionName.Pages).updateMany(
        {'draft.blocks': {$elemMatch: {type: 'linkPageBreak', hideButton: {$exists: false}}}},
        {
          $set: {
            'draft.blocks.$[elem].hideButton': false
          }
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Pages).updateMany(
        {
          'published.blocks': {
            $elemMatch: {type: 'linkPageBreak', hideButton: {$exists: false}}
          }
        },
        {
          $set: {'published.blocks.$[elem].hideButton': false}
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
      await db.collection(CollectionName.Pages).updateMany(
        {'pending.blocks': {$elemMatch: {type: 'linkPageBreak', hideButton: {$exists: false}}}},
        {
          $set: {'pending.blocks.$[elem].hideButton': false}
        },
        {arrayFilters: [{'elem.type': 'linkPageBreak'}]}
      )
    }
  },
  {
    // Add hide author property to article.
    version: 6,
    async migrate(db) {
      await db.collection(CollectionName.Articles).updateMany(
        {
          pending: {$ne: null},
          'pending.hideAuthor': {$exists: false}
        },
        {$set: {'pending.hideAuthor': false}}
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          published: {$ne: null},
          'published.hideAuthor': {$exists: false}
        },
        {$set: {'published.hideAuthor': false}}
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          draft: {$ne: null},
          'draft.hideAuthor': {$exists: false}
        },
        {$set: {'draft.hideAuthor': false}}
      )
    }
  },
  {
    // Add Call To Action Details to Peer Profile.
    version: 7,
    async migrate(db) {
      await db.collection(CollectionName.PeerProfiles).updateMany(
        {
          callToActionURL: {$exists: false},
          callToActionText: {$exists: false}
        },
        {
          $set: {
            callToActionURL: '',
            callToActionText: []
          }
        }
      )
    }
  },
  {
    // Add social media metatags to article.
    version: 8,
    async migrate(db) {
      await db.collection(CollectionName.Articles).updateMany(
        {
          pending: {$ne: null},
          'pending.socialMediaAuthorIDs': {$exists: false}
        },
        {
          $set: {
            'pending.socialMediaAuthorIDs': []
          }
        }
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          published: {$ne: null},
          'published.socialMediaAuthorIDs': {$exists: false}
        },
        {
          $set: {
            'published.socialMediaAuthorIDs': []
          }
        }
      )
      await db.collection(CollectionName.Articles).updateMany(
        {
          draft: {$ne: null},
          'draft.socialMediaAuthorIDs': {$exists: false}
        },
        {
          $set: {
            'draft.socialMediaAuthorIDs': []
          }
        }
      )
    }
  },
  {
    // Add new collection MailLog
    version: 9,
    async migrate(db) {
      const mailLogs = await db.createCollection(CollectionName.MailLog, {strict: true})
      await mailLogs.createIndex({subject: 1})
    }
  },
  {
    //  Add MemberPlan Collection and PaymentMethod Collection
    version: 10,
    async migrate(db, locale) {
      const memberPlans = await db.createCollection(CollectionName.MemberPlans, {
        strict: true
      })

      await memberPlans.createIndex({name: 1})
      await memberPlans.createIndex({slug: 1}, {unique: true})

      const paymentMethod = await db.createCollection(CollectionName.PaymentMethods, {
        strict: true
      })

      await paymentMethod.createIndex({name: 1})
      await paymentMethod.createIndex({paymentAdapter: 1})

      const users = db.collection(CollectionName.Users)
      await users.createIndex({'subscription.memberPlanId': 1})
      await users.updateMany(
        {
          paymentProviderCustomers: {$exists: false}
        },
        {$set: {paymentProviderCustomers: {}}}
      )

      await users.updateMany(
        {
          active: {$exists: false}
        },
        {$set: {active: true}}
      )

      await users.updateMany(
        {
          lastLogin: {$exists: false}
        },
        {$set: {lastLogin: null}}
      )

      await users.updateMany(
        {
          properties: {$exists: false}
        },
        {$set: {properties: []}}
      )

      const invoices = await db.createCollection(CollectionName.Invoices, {
        strict: true
      })

      await invoices.createIndex({mail: 1})

      const payments = await db.createCollection(CollectionName.Payments, {
        strict: true
      })

      await payments.createIndex({intentID: 1})
    }
  },
  {
    // Add Commenting Table.
    version: 11,
    async migrate(db) {
      const comments = await db.createCollection(CollectionName.Comments, {
        strict: true
      })
      await comments.createIndex({createdAt: -1})
      await comments.createIndex({'revisions.createdAt': -1})
    }
  },
  {
    //  Make slug for published pages unique
    version: 12,
    async migrate(db, locale) {
      const pages = await db.collection(CollectionName.Pages)
      await pages.createIndex(
        {'published.slug': 1},
        {
          collation: {locale, strength: 2},
          unique: true,
          partialFilterExpression: {'published.slug': {$exists: true}}
        }
      )
    }
  },
  {
    //  Rename street field in address to address
    version: 13,
    async migrate(db, locale) {
      const users = await db.collection(CollectionName.Users)
      await users.updateMany(
        {
          'address.street': {$exists: true}
        },
        {
          $rename: {'address.street': 'address.streetAddress'}
        }
      )
    }
  },
  {
    //  Add emailVerifiedAt and oauth2Accounts to user model
    version: 14,
    async migrate(db, locale) {
      const users = await db.collection(CollectionName.Users)
      await users.updateMany(
        {
          emailVerifiedAt: {$exists: false}
        },
        {$set: {emailVerifiedAt: null}}
      )

      await users.updateMany(
        {
          oauth2Accounts: {$exists: false}
        },
        {$set: {oauth2Accounts: []}}
      )
    }
  },
  {
    //  Set paymentProviderCustomers to an empty array
    version: 15,
    async migrate(db, locale) {
      const users = await db.collection(CollectionName.Users)

      const allUsers: DBUser[] = await users.find({}).toArray()

      for (const user of allUsers) {
        const paymentProvidersCustomersArray: PaymentProviderCustomer[] = []
        const paymentProviderCustomers = Object.keys(user.paymentProviderCustomers)
        paymentProviderCustomers.forEach(ppc => {
          interface OldPaymentProviderCustomer extends PaymentProviderCustomer {
            customerID: never
            id: PaymentProviderCustomer['customerID']
          }

          const userPPC = user.paymentProviderCustomers[+ppc] as OldPaymentProviderCustomer

          paymentProvidersCustomersArray.push({
            paymentProviderID: ppc,
            customerID: userPPC.id
          })
        })

        await users.updateOne(
          {_id: user._id},
          {$set: {paymentProviderCustomers: paymentProvidersCustomersArray}}
        )
      }
    }
  },
  {
    // add slug to existing paymentMethods
    version: 16,
    async migrate(db, locale) {
      const paymentMethods = await db.collection(CollectionName.PaymentMethods)

      const allPaymentMethods: DBPaymentMethod[] = await paymentMethods.find({}).toArray()

      for (const paymentMethod of allPaymentMethods) {
        const slug = slugify(paymentMethod.name)
        await paymentMethods.updateOne({_id: paymentMethod._id}, {$set: {slug}})
      }
    }
  },
  {
    // migrate existing deactivated subscriptions
    version: 17,
    async migrate(db, locale) {
      const users = await db.collection(CollectionName.Users)

      await users.updateMany(
        {
          $and: [
            {'subscription.deactivatedAt': {$exists: true}},
            {'subscription.deactivatedAt': null}
          ]
        },
        [
          {
            $set: {
              'subscription.deactivation': null
            }
          },
          {
            $unset: ['subscription.deactivatedAt']
          }
        ]
      )

      await users.updateMany(
        {
          $and: [
            {'subscription.deactivatedAt': {$exists: true}},
            {'subscription.deactivatedAt': {$ne: null}}
          ]
        },
        [
          {
            $set: {
              'subscription.deactivation.date': '$subscription.deactivatedAt',
              'subscription.deactivation.reason': SubscriptionDeactivationReason.None
            }
          },
          {
            $unset: ['subscription.deactivatedAt']
          }
        ]
      )
    }
  },
  {
    // migrate existing deactivated subscriptions
    version: 18,
    async migrate(db, locale) {
      // Values required to execute migration
      const TEMP_USER_PREFIX = '__temp_'
      const removePrefixTempUser = function removePrefixTempUser(userID: string): string {
        return userID.replace(TEMP_USER_PREFIX, '')
      }

      // 1. move subscription from user object into new subscription collection
      const users = await db.collection(CollectionName.Users)
      const userWithSubscriptions = await users.find({subscription: {$exists: true}}).toArray()
      const newSubscriptions: Omit<Subscription, 'id'>[] = []
      const OLD_TEMP_USER_REGEX = /^temp_[0-9]+_/
      for (const user of userWithSubscriptions) {
        if (!user.subscription) continue
        // create correct temp user reference id
        const userId = OLD_TEMP_USER_REGEX.test(user.email)
          ? `${TEMP_USER_PREFIX}${user._id}`
          : user._id
        newSubscriptions.push({
          userID: userId,
          createdAt: user.createdAt,
          modifiedAt: user.modifiedAt,
          memberPlanID: user.subscription.memberPlanID,
          paymentPeriodicity: user.subscription.paymentPeriodicity,
          monthlyAmount: user.subscription.monthlyAmount,
          autoRenew: user.subscription.autoRenew,
          startsAt: user.subscription.startsAt,
          paidUntil: user.subscription.paidUntil,
          periods: user.subscription.periods,
          paymentMethodID: user.subscription.paymentMethodID,
          properties: [],
          deactivation: user.subscription.deactivation
        })
      }
      const subscriptions = await db.createCollection(CollectionName.Subscriptions, {
        strict: true
      })
      if (newSubscriptions.length > 0) await subscriptions.insertMany(newSubscriptions)

      // 2. create new invoices
      const invoices = await db.collection(CollectionName.Invoices)
      const allInvoices = await invoices.find({}).toArray()
      const allSubscriptions = await subscriptions.find({}).toArray()
      const newInvoices: DBInvoice[] = []
      for (const invoice of allInvoices) {
        const userID = invoice.userID
        const subscription = allSubscriptions.find(
          subscription => removePrefixTempUser(subscription.userID) === userID
        )
        if (!subscription) {
          continue
        }
        newInvoices.push({
          _id: invoice._id,
          createdAt: invoice.createdAt,
          modifiedAt: invoice.modifiedAt,
          subscriptionID: subscription._id,
          description: invoice.description,
          canceledAt: invoice.canceledAt,
          dueAt: invoice.dueAt,
          items: invoice.items,
          mail: invoice.mail,
          paidAt: invoice.paidAt,
          sentReminderAt: invoice.sentReminderAt
        })
      }
      // inform We.Publish operators to remove this manually
      await invoices.rename('invoices.bak')
      const emptyInvoices = await db.createCollection(CollectionName.Invoices, {
        strict: true
      })
      if (newInvoices.length > 0) await emptyInvoices.insertMany(newInvoices)

      // 3. remove subscription object from user collection
      await users.updateMany(
        {subscription: {$exists: true}},
        {
          $unset: {subscription: ''}
        }
      )

      // 4. split existing user collection into new temp.user and user collection
      const tempUserQuery = {email: {$regex: OLD_TEMP_USER_REGEX}}
      const tempUsers = await users.find(tempUserQuery).toArray()
      const newTempUserCollection = await db.createCollection('temp.users', {
        strict: true
      })
      if (tempUsers.length) {
        // remove old temp_ prefix from emails in the new temp.user collection
        for (const tempUser of tempUsers) {
          tempUser.email = tempUser.email.replace(OLD_TEMP_USER_REGEX, '')
        }
        await newTempUserCollection.insertMany(tempUsers)

        // 5. delete migrated temp users from user collection
        await users.deleteMany(tempUserQuery)
      }
    }
  },
  {
    // rename image => source to link and author to source; This should make code and data consistent
    version: 19,
    async migrate(db, locale) {
      const images = await db.collection(CollectionName.Images)
      await images.updateMany({}, {$rename: {source: 'link'}})
      await images.updateMany({}, {$rename: {author: 'source'}})
    }
  },
  {
    // change embed block properties width and height from number to string
    version: 20,
    async migrate(db) {
      const articles = db.collection(CollectionName.Articles)
      const migrationArticles = await articles.find().toArray()

      for (const article of migrationArticles) {
        if (article.draft) {
          article.draft.blocks.forEach((block: ArticleBlock) => {
            if (block.type === BlockType.Embed) {
              block.height = String(block.height)
              block.width = String(block.width)
            }
          })
        }
        if (article.published) {
          article.published.blocks.forEach((block: ArticleBlock) => {
            if (block.type === BlockType.Embed) {
              block.height = String(block.height)
              block.width = String(block.width)
            }
          })
        }
        if (article.pending) {
          article.pending.blocks.forEach((block: ArticleBlock) => {
            if (block.type === BlockType.Embed) {
              block.height = String(block.height)
              block.width = String(block.width)
            }
          })
        }
        await articles.findOneAndReplace({_id: article._id}, article)
      }

      const pages = db.collection(CollectionName.Pages)
      const migrationPages = await pages.find().toArray()

      for (const page of migrationPages) {
        if (page.draft) {
          page.draft.blocks.forEach((block: PageBlock) => {
            if (block.type === BlockType.Embed) {
              block.height = String(block.height)
              block.width = String(block.width)
            }
          })
        }
        if (page.published) {
          page.published.blocks.forEach((block: PageBlock) => {
            if (block.type === BlockType.Embed) {
              block.height = String(block.height)
              block.width = String(block.width)
            }
          })
        }
        if (page.pending) {
          page.pending.blocks.forEach((block: PageBlock) => {
            if (block.type === BlockType.Embed) {
              block.height = String(block.height)
              block.width = String(block.width)
            }
          })
        }
        await pages.findOneAndReplace({_id: page._id}, page)
      }
    }
  },
  {
    version: 21,
    async migrate(db, locale) {
      const invoices = db.collection(CollectionName.Invoices)
      await invoices.updateMany({}, {$set: {manuallySetAsPaidByUserId: undefined}})
    }
  },
  {
    // Rename unused temp user collection. For operators to remove manually since the collection not used anymore.
    version: 22,
    async migrate(db) {
      const collections = await db.listCollections().toArray()
      if (collections.includes('temp.users')) {
        const tempUser = await db.collection('temp.users')
        await tempUser.rename('temp.users.bak')
      }
    }
  },
  {
    // add settings category
    version: 23,
    async migrate(db, locale) {
      const settingsDoc = await db.createCollection(CollectionName.Settings, {
        strict: true
      })

      const peeringTimeout: CreateSettingArgs<number> = {
        name: SettingName.PEERING_TIMEOUT_MS,
        value: 3000,
        settingRestriction: {minValue: 1000, maxValue: 10000}
      }
      const allowAnonCommenting: CreateSettingArgs<boolean> = {
        name: SettingName.ALLOW_GUEST_COMMENTING,
        value: false
      }
      const sendLoginJWTExpires: CreateSettingArgs<number> = {
        name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN,
        value: 10080,
        settingRestriction: {minValue: 1, maxValue: 10080}
      }

      const resetPwdExpires: CreateSettingArgs<number> = {
        name: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN,
        value: 1440,
        settingRestriction: {minValue: 1, maxValue: 10080}
      }
      const invoiceReminderFreq: CreateSettingArgs<number> = {
        name: SettingName.INVOICE_REMINDER_FREQ,
        value: 3,
        settingRestriction: {minValue: 0, maxValue: 30}
      }
      const invoiceReminderTries: CreateSettingArgs<number> = {
        name: SettingName.INVOICE_REMINDER_MAX_TRIES,
        value: 5,
        settingRestriction: {minValue: 0, maxValue: 10}
      }

      await settingsDoc.insertMany([
        peeringTimeout,
        allowAnonCommenting,
        sendLoginJWTExpires,
        resetPwdExpires,
        invoiceReminderFreq,
        invoiceReminderTries
      ])
    }
  }
]

export const LatestMigration = Migrations[Migrations.length - 1]
