"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPublicMutation = void 0;
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const graphql_1 = require("graphql");
const setting_1 = require("../db/setting");
const user_1 = require("../db/user");
const error_1 = require("../error");
const mailContext_1 = require("../mails/mailContext");
const server_1 = require("../server");
const utility_1 = require("../utility");
const validator_1 = require("../validator");
const comment_1 = require("./comment/comment");
const comment_public_mutation_1 = require("./comment/comment.public-mutation");
const common_1 = require("./common");
const memberPlan_1 = require("./memberPlan");
const payment_1 = require("./payment");
const poll_1 = require("./poll/poll");
const poll_public_mutation_1 = require("./poll/poll.public-mutation");
const session_1 = require("./session");
const session_mutation_1 = require("./session/session.mutation");
const slug_1 = require("./slug");
const subscription_1 = require("./subscription");
const subscription_public_mutation_1 = require("./subscription/subscription.public-mutation");
const user_2 = require("./user");
const user_mutation_1 = require("./user/user.mutation");
const comment_rating_1 = require("./comment-rating/comment-rating");
const user_public_mutation_1 = require("./user/user.public-mutation");
const comment_rating_public_mutation_1 = require("./comment-rating/comment-rating.public-mutation");
const image_1 = require("./image");
exports.GraphQLPublicMutation = new graphql_1.GraphQLObjectType({
    name: 'Mutation',
    fields: {
        // Session
        // =======
        createSession: {
            type: (0, graphql_1.GraphQLNonNull)(session_1.GraphQLPublicSessionWithToken),
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { email, password }, { sessionTTL, prisma }) => (0, session_mutation_1.createSession)(email, password, sessionTTL, prisma.session, prisma.user, prisma.userRole)
        },
        createSessionWithJWT: {
            type: (0, graphql_1.GraphQLNonNull)(session_1.GraphQLPublicSessionWithToken),
            args: {
                jwt: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { jwt }, { sessionTTL, prisma, verifyJWT }) => (0, session_mutation_1.createJWTSession)(jwt, sessionTTL, verifyJWT, prisma.session, prisma.user, prisma.userRole)
        },
        createSessionWithOAuth2Code: {
            type: (0, graphql_1.GraphQLNonNull)(session_1.GraphQLPublicSessionWithToken),
            args: {
                name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                code: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                redirectUri: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { name, code, redirectUri }, { sessionTTL, prisma, oauth2Providers }) => (0, session_mutation_1.createOAuth2Session)(name, code, redirectUri, sessionTTL, oauth2Providers, prisma.session, prisma.user, prisma.userRole)
        },
        revokeActiveSession: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean),
            args: {},
            description: 'This mutation revokes and deletes the active session.',
            resolve: (root, _, { authenticateUser, prisma: { session } }) => (0, session_mutation_1.revokeSessionByToken)(authenticateUser, session)
        },
        // Comment
        // =======
        addComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicComment),
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicCommentInput) } },
            description: 'This mutation allows to add a comment. The input is of type CommentInput.',
            resolve: (_, { input }, { optionalAuthenticateUser, prisma: { comment, setting }, challenge }) => (0, comment_public_mutation_1.addPublicComment)(input, optionalAuthenticateUser, challenge, setting, comment)
        },
        updateComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicComment),
            args: {
                input: { type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicCommentUpdateInput) }
            },
            description: 'This mutation allows to update a comment. The input is of type CommentUpdateInput which contains the ID of the comment you want to update and the new text.',
            resolve: (_, { input }, { prisma: { comment }, authenticateUser }) => (0, comment_public_mutation_1.updatePublicComment)(input, authenticateUser, comment)
        },
        rateComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLCommentRating),
            args: {
                commentId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                answerId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                value: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
            },
            description: 'This mutation allows to rate a comment. Supports logged in and anonymous',
            resolve: (root, { commentId, answerId, value }, { optionalAuthenticateUser, prisma: { commentRating, commentRatingSystemAnswer, setting } }) => (0, comment_rating_public_mutation_1.rateComment)(commentId, answerId, value, undefined, optionalAuthenticateUser, commentRatingSystemAnswer, commentRating, setting)
        },
        registerMember: {
            type: (0, graphql_1.GraphQLNonNull)(user_2.GraphQLMemberRegistration),
            args: {
                name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                firstName: { type: graphql_1.GraphQLString },
                preferredName: { type: graphql_1.GraphQLString },
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                address: { type: user_2.GraphQLUserAddressInput },
                password: { type: graphql_1.GraphQLString },
                challengeAnswer: {
                    type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLChallengeInput)
                }
            },
            description: 'This mutation allows to register a new member,',
            async resolve(root, { name, firstName, preferredName, email, address, password, challengeAnswer }, { sessionTTL, hashCostFactor, prisma, challenge }) {
                email = email.toLowerCase();
                await validator_1.Validator.createUser().validateAsync({ name, email, firstName, preferredName }, { allowUnknown: true });
                const challengeValidationResult = await challenge.validateChallenge({
                    challengeID: challengeAnswer.challengeID,
                    solution: challengeAnswer.challengeSolution
                });
                if (!challengeValidationResult.valid) {
                    throw new error_1.CommentAuthenticationError(challengeValidationResult.message);
                }
                const userExists = await prisma.user.findUnique({
                    where: {
                        email
                    },
                    select: user_1.unselectPassword
                });
                if (userExists) {
                    throw new error_1.EmailAlreadyInUseError();
                }
                if (!password) {
                    password = crypto.randomBytes(48).toString('base64');
                }
                const user = await (0, user_mutation_1.createUser)({
                    name,
                    firstName,
                    preferredName,
                    email,
                    address,
                    emailVerifiedAt: null,
                    active: true,
                    roleIDs: [],
                    password
                }, hashCostFactor, prisma.user);
                if (!user) {
                    (0, server_1.logger)('mutation.public').error('Could not create new user for email "%s"', email);
                    throw new error_1.InternalError();
                }
                const session = await (0, session_mutation_1.createUserSession)(user, sessionTTL, prisma.session, prisma.userRole);
                return {
                    user,
                    session
                };
            }
        },
        registerMemberAndReceivePayment: {
            type: (0, graphql_1.GraphQLNonNull)(user_2.GraphQLMemberRegistrationAndPayment),
            args: {
                name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                firstName: { type: graphql_1.GraphQLString },
                preferredName: { type: graphql_1.GraphQLString },
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                address: { type: user_2.GraphQLUserAddressInput },
                password: { type: graphql_1.GraphQLString },
                memberPlanID: { type: graphql_1.GraphQLID },
                memberPlanSlug: { type: slug_1.GraphQLSlug },
                autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
                paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
                monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
                paymentMethodID: { type: graphql_1.GraphQLID },
                paymentMethodSlug: { type: slug_1.GraphQLSlug },
                subscriptionProperties: {
                    type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyPublicInput))
                },
                successURL: { type: graphql_1.GraphQLString },
                failureURL: { type: graphql_1.GraphQLString },
                challengeAnswer: {
                    type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLChallengeInput)
                }
            },
            description: 'This mutation allows to register a new member, select a member plan, payment method and create an invoice. ',
            async resolve(root, { name, firstName, preferredName, email, address, password, memberPlanID, memberPlanSlug, autoRenew, paymentPeriodicity, monthlyAmount, paymentMethodID, paymentMethodSlug, subscriptionProperties, successURL, failureURL, challengeAnswer }, { sessionTTL, hashCostFactor, prisma, loaders, memberContext, challenge, createPaymentWithProvider }) {
                email = email.toLowerCase();
                await validator_1.Validator.createUser().validateAsync({ name, email, firstName, preferredName }, { allowUnknown: true });
                const challengeValidationResult = await challenge.validateChallenge({
                    challengeID: challengeAnswer.challengeID,
                    solution: challengeAnswer.challengeSolution
                });
                if (!challengeValidationResult.valid)
                    throw new error_1.CommentAuthenticationError(challengeValidationResult.message);
                await memberContext.validateInputParamsCreateSubscription(memberPlanID, memberPlanSlug, paymentMethodID, paymentMethodSlug);
                const memberPlan = await memberContext.getMemberPlanByIDOrSlug(loaders, memberPlanSlug, memberPlanID);
                const paymentMethod = await memberContext.getPaymentMethodByIDOrSlug(loaders, paymentMethodSlug, paymentMethodID);
                // Check that monthly amount not
                if (monthlyAmount < memberPlan.amountPerMonthMin)
                    throw new error_1.MonthlyAmountNotEnough();
                await memberContext.validateSubscriptionPaymentConfiguration(memberPlan, autoRenew, paymentPeriodicity, paymentMethod);
                const userExists = await prisma.user.findUnique({
                    where: {
                        email
                    },
                    select: user_1.unselectPassword
                });
                if (userExists)
                    throw new error_1.EmailAlreadyInUseError();
                if (!password)
                    password = crypto.randomBytes(48).toString('base64');
                const user = await (0, user_mutation_1.createUser)({
                    name,
                    firstName,
                    preferredName,
                    email,
                    address,
                    emailVerifiedAt: null,
                    active: true,
                    roleIDs: [],
                    password
                }, hashCostFactor, prisma.user);
                if (!user) {
                    (0, server_1.logger)('mutation.public').error('Could not create new user for email "%s"', email);
                    throw new error_1.InternalError();
                }
                const session = await (0, session_mutation_1.createUserSession)(user, sessionTTL, prisma.session, prisma.userRole);
                const properties = await memberContext.processSubscriptionProperties(subscriptionProperties);
                const subscription = await memberContext.createSubscription(prisma.subscription, user.id, paymentMethod, paymentPeriodicity, monthlyAmount, memberPlan, properties, autoRenew);
                // Create Periods, Invoices and Payment
                const invoice = await memberContext.renewSubscriptionForUser({
                    subscription
                });
                if (!invoice) {
                    (0, server_1.logger)('mutation.public').error('Could not create new invoice for subscription with ID "%s"', subscription.id);
                    throw new error_1.InternalError();
                }
                return {
                    payment: await createPaymentWithProvider({
                        invoice,
                        saveCustomer: true,
                        paymentMethodID: paymentMethod.id,
                        successURL,
                        failureURL
                    }),
                    user,
                    session
                };
            }
        },
        createSubscription: {
            type: (0, graphql_1.GraphQLNonNull)(payment_1.GraphQLPublicPayment),
            args: {
                memberPlanID: { type: graphql_1.GraphQLID },
                memberPlanSlug: { type: slug_1.GraphQLSlug },
                autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
                paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
                monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
                paymentMethodID: { type: graphql_1.GraphQLID },
                paymentMethodSlug: { type: slug_1.GraphQLSlug },
                subscriptionProperties: {
                    type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyPublicInput))
                },
                successURL: { type: graphql_1.GraphQLString },
                failureURL: { type: graphql_1.GraphQLString }
            },
            description: 'Allows authenticated users to create additional subscriptions',
            async resolve(root, { memberPlanID, memberPlanSlug, autoRenew, paymentPeriodicity, monthlyAmount, paymentMethodID, paymentMethodSlug, subscriptionProperties, successURL, failureURL }, { prisma, loaders, memberContext, createPaymentWithProvider, authenticateUser }) {
                // authenticate user
                const { user } = authenticateUser();
                await memberContext.validateInputParamsCreateSubscription(memberPlanID, memberPlanSlug, paymentMethodID, paymentMethodSlug);
                const memberPlan = await memberContext.getMemberPlanByIDOrSlug(loaders, memberPlanSlug, memberPlanID);
                const paymentMethod = await memberContext.getPaymentMethodByIDOrSlug(loaders, paymentMethodSlug, paymentMethodID);
                if (monthlyAmount < memberPlan.amountPerMonthMin)
                    throw new error_1.MonthlyAmountNotEnough();
                await memberContext.validateSubscriptionPaymentConfiguration(memberPlan, autoRenew, paymentPeriodicity, paymentMethod);
                const properties = await memberContext.processSubscriptionProperties(subscriptionProperties);
                const subscription = await memberContext.createSubscription(prisma.subscription, user.id, paymentMethod, paymentPeriodicity, monthlyAmount, memberPlan, properties, autoRenew);
                // Create Periods, Invoices and Payment
                const invoice = await memberContext.renewSubscriptionForUser({
                    subscription
                });
                if (!invoice) {
                    (0, server_1.logger)('mutation.public').error('Could not create new invoice for subscription with ID "%s"', subscription.id);
                    throw new error_1.InternalError();
                }
                return await createPaymentWithProvider({
                    invoice,
                    saveCustomer: true,
                    paymentMethodID: paymentMethod.id,
                    successURL,
                    failureURL
                });
            }
        },
        extendSubscription: {
            type: (0, graphql_1.GraphQLNonNull)(payment_1.GraphQLPublicPayment),
            args: {
                subscriptionId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                successURL: { type: graphql_1.GraphQLString },
                failureURL: { type: graphql_1.GraphQLString }
            },
            description: 'This mutation extends an subscription early',
            async resolve(root, { subscriptionId, successURL, failureURL }, { prisma, authenticateUser, memberContext, createPaymentWithProvider, paymentProviders, loaders }) {
                // authenticate user
                const { user } = authenticateUser();
                const subscription = (await prisma.subscription.findUnique({
                    where: {
                        id: subscriptionId
                    }
                }));
                // Allow only valid and subscription belonging to the user to early extend
                if (!subscription || subscription.userID !== user.id) {
                    (0, server_1.logger)('extendSubscription').error('Could not find subscription with ID "%s" or subscription does not belong to user "%s"', subscriptionId, user.id);
                    throw new error_1.SubscriptionNotFound();
                }
                // Throw for unsupported payment providers
                const paymentMethod = await prisma.paymentMethod.findUnique({
                    where: {
                        id: subscription.paymentMethodID
                    }
                });
                if (!paymentMethod) {
                    (0, server_1.logger)('extendSubscription').error('Could not find paymentMethod with ID "%s"', subscription.paymentMethodID);
                    throw new error_1.InternalError();
                }
                const paymentProvider = paymentProviders.find(obj => obj.id === paymentMethod.paymentProviderID);
                // Prevent user from creating new invoice while having unpaid invoices
                const unpaidInvoices = await prisma.invoice.findMany({
                    where: {
                        subscriptionID: subscription.id,
                        paidAt: null
                    }
                });
                if (unpaidInvoices.length > 0) {
                    throw new error_1.AlreadyUnpaidInvoices();
                }
                const invoice = await memberContext.renewSubscriptionForUser({
                    subscription
                });
                if (!invoice) {
                    (0, server_1.logger)('extendSubscription').error('Could not create new invoice for subscription with ID "%s"', subscription.id);
                    throw new error_1.InternalError();
                }
                // If payment provider supports off session payment try to charge
                if (!paymentProvider || paymentProvider.offSessionPayments) {
                    const paymentMethod = await loaders.paymentMethodsByID.load(subscription.paymentMethodID);
                    if (!paymentMethod) {
                        (0, server_1.logger)('extendSubscription').warn('paymentMethod %s not found', subscription.paymentMethodID);
                        throw new error_1.InternalError();
                    }
                    const fullUser = await prisma.user.findUnique({
                        where: { id: subscription.userID },
                        select: user_1.unselectPassword
                    });
                    if (!fullUser) {
                        (0, server_1.logger)('extendSubscription').warn('user %s not found', subscription.userID);
                        throw new error_1.InternalError();
                    }
                    const customer = fullUser.paymentProviderCustomers.find(ppc => ppc.paymentProviderID === paymentMethod.paymentProviderID);
                    if (!customer) {
                        (0, server_1.logger)('extendSubscription').warn('customer %s not found', paymentMethod.paymentProviderID);
                        throw new error_1.InternalError();
                    }
                    // Charge customer
                    try {
                        const payment = await memberContext.chargeInvoice({
                            user,
                            invoice,
                            paymentMethodID: subscription.paymentMethodID,
                            customer
                        });
                        if (payment) {
                            return payment;
                        }
                    }
                    catch (e) {
                        (0, server_1.logger)('extendSubscription').warn('Invoice off session charge for subscription %s failed: %s', subscription.id, e);
                    }
                }
                return await createPaymentWithProvider({
                    invoice,
                    saveCustomer: true,
                    paymentMethodID: subscription.paymentMethodID,
                    successURL,
                    failureURL
                });
            }
        },
        sendWebsiteLogin: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            description: 'This mutation sends a login link to the email if the user exists. Method will always return email address',
            async resolve(root, { email }, { prisma, generateJWT, mailContext, urlAdapter }) {
                var _a, _b;
                email = email.toLowerCase();
                await validator_1.Validator.login().validateAsync({ email }, { allowUnknown: true });
                const user = await prisma.user.findUnique({
                    where: { email },
                    select: user_1.unselectPassword
                });
                if (!user)
                    return email;
                const lastSendTimeStamp = user.properties.find(property => (property === null || property === void 0 ? void 0 : property.key) === utility_1.USER_PROPERTY_LAST_LOGIN_LINK_SEND);
                if (lastSendTimeStamp &&
                    parseInt(lastSendTimeStamp.value) > Date.now() - utility_1.FIFTEEN_MINUTES_IN_MILLISECONDS) {
                    (0, server_1.logger)('mutation.public').warn('User with ID %s requested Login Link multiple times in 15 min time window', user.id);
                    return email;
                }
                const resetPwdSetting = await prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN }
                });
                const resetPwd = (_a = resetPwdSetting === null || resetPwdSetting === void 0 ? void 0 : resetPwdSetting.value) !== null && _a !== void 0 ? _a : parseInt((_b = process.env.RESET_PASSWORD_JWT_EXPIRES_MIN) !== null && _b !== void 0 ? _b : '');
                if (!resetPwd) {
                    throw new Error('No value set for RESET_PASSWORD_JWT_EXPIRES_MIN');
                }
                const token = generateJWT({
                    id: user.id,
                    expiresInMinutes: resetPwd
                });
                await mailContext.sendMail({
                    type: mailContext_1.SendMailType.LoginLink,
                    recipient: user.email,
                    data: {
                        url: urlAdapter.getLoginURL(token),
                        user
                    }
                });
                try {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            properties: {
                                deleteMany: {
                                    key: utility_1.USER_PROPERTY_LAST_LOGIN_LINK_SEND
                                },
                                create: {
                                    key: utility_1.USER_PROPERTY_LAST_LOGIN_LINK_SEND,
                                    public: false,
                                    value: `${Date.now()}`
                                }
                            }
                        }
                    });
                }
                catch (error) {
                    (0, server_1.logger)('mutation.public').warn(error, 'Updating User with ID %s failed', user.id);
                }
                return email;
            }
        },
        updateUser: {
            type: user_2.GraphQLPublicUser,
            args: {
                input: { type: (0, graphql_1.GraphQLNonNull)(user_2.GraphQLPublicUserInput) }
            },
            description: "This mutation allows to update the user's data by taking an input of type UserInput.",
            resolve: (root, { input }, { authenticateUser, mediaAdapter, prisma: { user, image } }) => (0, user_public_mutation_1.updatePublicUser)(input, authenticateUser, mediaAdapter, user, image)
        },
        uploadUserProfileImage: {
            type: user_2.GraphQLPublicUser,
            args: {
                uploadImageInput: { type: image_1.GraphQLUploadImageInput }
            },
            description: "This mutation allows to upload and update the user's profile image.",
            resolve: (root, { uploadImageInput }, { authenticateUser, mediaAdapter, prisma: { image, user } }) => (0, user_public_mutation_1.uploadPublicUserProfileImage)(uploadImageInput, authenticateUser, mediaAdapter, image, user)
        },
        updatePassword: {
            type: user_2.GraphQLPublicUser,
            args: {
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                passwordRepeated: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            description: "This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.",
            resolve: (root, { password, passwordRepeated }, { authenticateUser, prisma: { user }, hashCostFactor }) => (0, user_public_mutation_1.updateUserPassword)(password, passwordRepeated, hashCostFactor, authenticateUser, user)
        },
        updateUserSubscription: {
            type: subscription_1.GraphQLPublicSubscription,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(subscription_1.GraphQLPublicSubscriptionInput) }
            },
            description: "This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null",
            resolve: (root, { id, input }, { authenticateUser, prisma: { subscription }, loaders, memberContext }) => (0, subscription_public_mutation_1.updatePublicSubscription)(id, input, authenticateUser, memberContext, loaders.activeMemberPlansByID, loaders.activePaymentMethodsByID, subscription)
        },
        cancelUserSubscription: {
            type: subscription_1.GraphQLPublicSubscription,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            description: 'This mutation allows to cancel the users subscriptions. The deactivation date will be either paidUntil or now',
            async resolve(root, { id }, { authenticateUser, prisma, memberContext }) {
                const { user } = authenticateUser();
                if (!user)
                    throw new error_1.NotAuthenticatedError();
                const subscription = await prisma.subscription.findUnique({
                    where: { id },
                    include: {
                        deactivation: true,
                        periods: true,
                        properties: true
                    }
                });
                if (!subscription)
                    throw new error_1.NotFound('subscription', id);
                if (subscription.deactivation)
                    throw new error_1.UserSubscriptionAlreadyDeactivated(subscription.deactivation.date);
                const now = new Date();
                const deactivationDate = subscription.paidUntil !== null && subscription.paidUntil > now
                    ? subscription.paidUntil
                    : now;
                await memberContext.deactivateSubscriptionForUser({
                    subscriptionID: subscription.id,
                    deactivationDate,
                    deactivationReason: client_1.SubscriptionDeactivationReason.userSelfDeactivated
                });
                const updatedSubscription = await prisma.subscription.findUnique({
                    where: { id },
                    include: {
                        deactivation: true,
                        periods: true,
                        properties: true
                    }
                });
                if (!updatedSubscription)
                    throw new error_1.NotFound('subscription', id);
                return updatedSubscription;
            }
        },
        updatePaymentProviderCustomers: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(user_2.GraphQLPaymentProviderCustomer))),
            args: {
                input: {
                    type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(user_2.GraphQLPaymentProviderCustomerInput)))
                }
            },
            description: 'This mutation allows to update the Payment Provider Customers',
            resolve: (root, { input }, { authenticateUser, prisma: { user } }) => (0, user_public_mutation_1.updatePaymentProviderCustomers)(input, authenticateUser, user)
        },
        createPaymentFromInvoice: {
            type: payment_1.GraphQLPublicPayment,
            args: {
                input: { type: (0, graphql_1.GraphQLNonNull)(payment_1.GraphQLPaymentFromInvoiceInput) }
            },
            description: 'This mutation allows to create payment by taking an input of type PaymentFromInvoiceInput.',
            async resolve(root, { input }, { authenticateUser, createPaymentWithProvider, loaders, prisma }) {
                const { user } = authenticateUser();
                const { invoiceID, paymentMethodID, paymentMethodSlug, successURL, failureURL } = input;
                if ((paymentMethodID == null && paymentMethodSlug == null) ||
                    (paymentMethodID != null && paymentMethodSlug != null)) {
                    throw new error_1.UserInputError('You must provide either `paymentMethodID` or `paymentMethodSlug`.');
                }
                const paymentMethod = paymentMethodID
                    ? await loaders.activePaymentMethodsByID.load(paymentMethodID)
                    : await loaders.activePaymentMethodsBySlug.load(paymentMethodSlug);
                if (!paymentMethod)
                    throw new error_1.NotFound('PaymentMethod', paymentMethodID || paymentMethodSlug);
                const invoice = await prisma.invoice.findUnique({
                    where: { id: invoiceID },
                    include: {
                        items: true
                    }
                });
                if (!invoice || !invoice.subscriptionID)
                    throw new error_1.NotFound('Invoice', invoiceID);
                const subscription = await prisma.subscription.findUnique({
                    where: {
                        id: invoice.subscriptionID
                    },
                    include: {
                        deactivation: true,
                        periods: true,
                        properties: true
                    }
                });
                if (!subscription || subscription.userID !== user.id)
                    throw new error_1.NotFound('Invoice', invoiceID);
                return await createPaymentWithProvider({
                    paymentMethodID: paymentMethod.id,
                    invoice,
                    saveCustomer: false,
                    successURL,
                    failureURL
                });
            }
        },
        voteOnPoll: {
            type: poll_1.GraphQLPollVote,
            args: {
                answerId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            description: "This mutation allows to vote on a poll (or update one's decision). Supports logged in and anonymous",
            resolve: (root, { answerId }, { optionalAuthenticateUser, prisma: { pollAnswer, pollVote, setting } }) => (0, poll_public_mutation_1.voteOnPoll)(answerId, undefined, optionalAuthenticateUser, pollAnswer, pollVote, setting)
        }
    }
});
//# sourceMappingURL=mutation.public.js.map