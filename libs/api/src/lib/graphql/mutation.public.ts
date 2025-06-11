import {MemberPlan} from '@prisma/client'
import {unselectPassword} from '@wepublish/authentication/api'
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../context'
import {SubscriptionWithRelations} from '../db/subscription'
import {
  AlreadyUnpaidInvoices,
  InternalError,
  MonthlyAmountNotEnough,
  SubscriptionNotExtendable,
  SubscriptionNotFound,
  UserIdNotFound
} from '../error'
import {GraphQLSlug, logger} from '@wepublish/utils/api'
import {GraphQLMetadataPropertyPublicInput} from './common'
import {GraphQLUploadImageInput} from './image'
import {GraphQLPaymentPeriodicity} from './memberPlan'
import {GraphQLPublicPayment} from './payment'
import {GraphQLPublicUser, GraphQLPublicUserInput} from './user'
import {updatePublicUser, uploadPublicUserProfileImage} from './user/user.public-mutation'
import {getMemberPlanByIDOrSlug, getPaymentMethodByIDOrSlug} from '../memberContext'

export const GraphQLPublicMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    createSubscriptionWithConfirmation: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        userId: {type: GraphQLString},
        memberPlanID: {type: GraphQLString},
        memberPlanSlug: {type: GraphQLSlug},
        autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLString},
        paymentMethodSlug: {type: GraphQLSlug},
        subscriptionProperties: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublicInput))
        }
      },
      description: 'Allows authenticated users to create additional subscriptions',
      async resolve(
        root,
        {
          userId,
          memberPlanID,
          memberPlanSlug,
          autoRenew,
          paymentPeriodicity,
          monthlyAmount,
          paymentMethodID,
          paymentMethodSlug,
          subscriptionProperties
        },
        {prisma, loaders, memberContext, createPaymentWithProvider, authenticateUser}
      ) {
        try {
          // authenticate user
          const getUserByUserId = async (userId: string) => ({
            user: await prisma.user.findFirst({where: {id: userId}})
          })
          const {user} = userId ? await getUserByUserId(userId) : authenticateUser()

          if (!user) {
            throw new UserIdNotFound()
          }

          await memberContext.validateInputParamsCreateSubscription(
            memberPlanID,
            memberPlanSlug,
            paymentMethodID,
            paymentMethodSlug
          )

          const memberPlan = await getMemberPlanByIDOrSlug(loaders, memberPlanSlug, memberPlanID)
          const paymentMethod = await getPaymentMethodByIDOrSlug(
            loaders,
            paymentMethodSlug,
            paymentMethodID
          )

          if (monthlyAmount < memberPlan.amountPerMonthMin) throw new MonthlyAmountNotEnough()

          await memberContext.validateSubscriptionPaymentConfiguration(
            memberPlan,
            autoRenew,
            paymentPeriodicity,
            paymentMethod
          )

          const properties = await memberContext.processSubscriptionProperties(
            subscriptionProperties
          )

          const {subscription, invoice} = await memberContext.createSubscription(
            user.id,
            paymentMethod.id,
            paymentPeriodicity,
            monthlyAmount,
            memberPlan.id,
            properties,
            autoRenew,
            memberPlan.extendable,
            undefined,
            undefined,
            true
          )

          if (!invoice) {
            logger('mutation.public').error(
              'Could not create new invoice for subscription with ID "%s"',
              subscription.id
            )
            throw new InternalError()
          }

          return true
        } catch (e: any) {
          console.log(e.stack)
          throw e
        }
      }
    },

    extendSubscription: {
      type: new GraphQLNonNull(GraphQLPublicPayment),
      args: {
        subscriptionId: {type: new GraphQLNonNull(GraphQLString)},
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString}
      },
      description: 'This mutation extends an subscription early',
      async resolve(
        root,
        {subscriptionId, successURL, failureURL},
        {
          prisma,
          authenticateUser,
          memberContext,
          createPaymentWithProvider,
          paymentProviders,
          loaders
        }
      ) {
        // authenticate user
        const {user} = authenticateUser()

        const subscription = (await prisma.subscription.findUnique({
          where: {
            id: subscriptionId
          },
          include: {
            memberPlan: true
          }
        })) as SubscriptionWithRelations & {memberPlan: MemberPlan}
        // Allow only valid and subscription belonging to the user to early extend
        if (!subscription || subscription.userID !== user.id) {
          logger('extendSubscription').error(
            'Could not find subscription with ID "%s" or subscription does not belong to user "%s"',
            subscriptionId,
            user.id
          )
          throw new SubscriptionNotFound()
        }

        // Prevent user from extending not extendable subscription
        if (!subscription.extendable) {
          throw new SubscriptionNotExtendable(subscription.id)
        }

        // Throw for unsupported payment providers
        const paymentMethod = await prisma.paymentMethod.findUnique({
          where: {
            id: subscription.paymentMethodID
          }
        })
        if (!paymentMethod) {
          logger('extendSubscription').error(
            'Could not find paymentMethod with ID "%s"',
            subscription.paymentMethodID
          )
          throw new InternalError()
        }

        const paymentProvider = paymentProviders.find(
          obj => obj.id === paymentMethod.paymentProviderID
        )

        // Prevent user from creating new invoice while having unpaid invoices
        const unpaidInvoices = await prisma.invoice.findMany({
          where: {
            subscriptionID: subscription.id,
            paidAt: null
          }
        })
        if (unpaidInvoices.length > 0) {
          throw new AlreadyUnpaidInvoices()
        }

        const invoice = await memberContext.renewSubscriptionForUser({
          subscription
        })
        if (!invoice) {
          logger('extendSubscription').error(
            'Could not create new invoice for subscription with ID "%s"',
            subscription.id
          )
          throw new InternalError()
        }

        // If payment provider supports off session payment try to charge
        if (!paymentProvider || paymentProvider.offSessionPayments) {
          const paymentMethod = await loaders.paymentMethodsByID.load(subscription.paymentMethodID)
          if (!paymentMethod) {
            logger('extendSubscription').warn(
              'paymentMethod %s not found',
              subscription.paymentMethodID
            )
            throw new InternalError()
          }

          const fullUser = await prisma.user.findUnique({
            where: {id: subscription.userID},
            select: unselectPassword
          })
          if (!fullUser) {
            logger('extendSubscription').warn('user %s not found', subscription.userID)
            throw new InternalError()
          }

          const customer = fullUser.paymentProviderCustomers.find(
            ppc => ppc.paymentProviderID === paymentMethod.paymentProviderID
          )
          if (!customer) {
            logger('extendSubscription').warn(
              'customer %s not found',
              paymentMethod.paymentProviderID
            )
          } else {
            // Charge customer
            try {
              const payment = await memberContext.chargeInvoice({
                user,
                invoice,
                paymentMethodID: subscription.paymentMethodID,
                customer
              })
              if (payment) {
                return payment
              }
            } catch (e) {
              logger('extendSubscription').warn(
                'Invoice off session charge for subscription %s failed: %s',
                subscription.id,
                e
              )
            }
          }
        }

        return await createPaymentWithProvider({
          invoice,
          saveCustomer: true,
          paymentMethodID: subscription.paymentMethodID,
          successURL,
          failureURL,
          migrateToTargetPaymentMethodID:
            subscription.memberPlan.migrateToTargetPaymentMethodID ?? undefined
        })
      }
    },

    updateUser: {
      type: GraphQLPublicUser,
      args: {
        input: {type: new GraphQLNonNull(GraphQLPublicUserInput)}
      },
      description:
        "This mutation allows to update the user's data by taking an input of type UserInput.",
      resolve: (root, {input}, {authenticateUser, mediaAdapter, prisma: {user, image}}) =>
        updatePublicUser(input, authenticateUser, mediaAdapter, user, image)
    },

    uploadUserProfileImage: {
      type: GraphQLPublicUser,
      args: {
        uploadImageInput: {type: GraphQLUploadImageInput}
      },
      description: "This mutation allows to upload and update the user's profile image.",
      resolve: (
        root,
        {uploadImageInput},
        {authenticateUser, mediaAdapter, prisma: {image, user}}
      ) =>
        uploadPublicUserProfileImage(uploadImageInput, authenticateUser, mediaAdapter, image, user)
    }
  }
})
