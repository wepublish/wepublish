import {MemberPlan, PaymentMethod} from '@prisma/client'
import formatISO from 'date-fns/formatISO'
import {GraphQLFieldResolver, GraphQLIsTypeOfFn, GraphQLObjectType} from 'graphql'
import {delegateToSchema, IDelegateToSchemaOptions, Transform} from '@graphql-tools/delegate'
import {ExecutionResult} from '@graphql-tools/utils'
import {Context} from './context'
import {Block, BlockType, TeaserStyle} from './db/block'
import {SubscriptionWithRelations} from './db/subscription'
import {UserWithRelations} from './db/user'
import {format} from 'date-fns'
import {toPlaintext} from '@wepublish/richtext'

export const MAX_PAYLOAD_SIZE = '1MB'

export const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000
export const ONE_DAY_IN_MILLISECONDS = 24 * ONE_HOUR_IN_MILLISECONDS
export const FIFTEEN_MINUTES_IN_MILLISECONDS = 900000
export const ONE_MONTH_IN_MILLISECONDS = 31 * ONE_DAY_IN_MILLISECONDS

export const USER_PROPERTY_LAST_LOGIN_LINK_SEND = '_wepLastLoginLinkSentTimestamp'

export function mapSubscriptionsAsCsv(
  subscriptions: (SubscriptionWithRelations & {
    user: UserWithRelations
    paymentMethod: PaymentMethod
    memberPlan: MemberPlan
  })[]
) {
  let csvStr =
    [
      'id',
      'firstName',
      'name',
      'birthday',
      'email',
      'active',
      'createdAt',
      'modifiedAt',

      'company',
      'streetAddress',
      'streetAddress2',
      'zipCode',
      'city',
      'country',

      'memberPlan',
      'memberPlanID',
      'paymentPeriodicity',
      'monthlyAmount',
      'autoRenew',
      'extendable',
      'startsAt',
      'paidUntil',
      'paymentMethod',
      'paymentMethodID',
      'deactivationDate',
      'deactivationReason'
    ].join(',') + '\n'

  for (const subscription of subscriptions) {
    const user = subscription?.user
    const memberPlan = subscription?.memberPlan
    const paymentMethod = subscription?.paymentMethod
    // if (!user) continue
    csvStr +=
      [
        user?.id,
        `${sanitizeCsvContent(user?.firstName)}`,
        `${sanitizeCsvContent(user?.name)}`,
        `${user?.birthday ? format(user?.birthday, 'yyyy-MM-dd') : ''}`,
        `${user?.email ?? ''}`,
        user?.active,
        user?.createdAt ? formatISO(user.createdAt, {representation: 'date'}) : '',
        user?.modifiedAt ? formatISO(user.modifiedAt, {representation: 'date'}) : '',
        `${sanitizeCsvContent(user?.address?.company)}`,
        `${sanitizeCsvContent(user?.address?.streetAddress)}`,
        `${sanitizeCsvContent(user?.address?.streetAddress2)}`,
        `${sanitizeCsvContent(user?.address?.zipCode)}`,
        `${sanitizeCsvContent(user?.address?.city)}`,
        `${sanitizeCsvContent(user?.address?.country)}`,
        sanitizeCsvContent(memberPlan?.name),
        subscription?.memberPlanID ?? '',
        subscription?.paymentPeriodicity ?? '',
        subscription?.monthlyAmount ?? '',
        subscription?.autoRenew ?? '',
        subscription?.extendable ?? '',
        subscription?.startsAt ? formatISO(subscription.startsAt, {representation: 'date'}) : '',
        subscription?.paidUntil
          ? formatISO(subscription.paidUntil, {representation: 'date'})
          : 'no pay',
        sanitizeCsvContent(paymentMethod?.name),
        subscription?.paymentMethodID ?? '',
        subscription?.deactivation
          ? formatISO(subscription.deactivation.date, {representation: 'date'})
          : '',
        subscription?.deactivation?.reason ?? ''
      ].join(',') + '\r\n'
  }

  return csvStr
}

/**
 * according to rfc 4180
 * https://www.ietf.org/rfc/rfc4180.txt
 * @param input
 */
function sanitizeCsvContent(input: string | undefined | null) {
  // according rfc 4180 2.7.
  const escapeDoubleQuotes = (input || '').toString().replace(/[#"]/g, '""')
  // according rfc 4180 2.5. / 2.6.
  return `"${escapeDoubleQuotes}"`
}

export function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64')
}

export function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString()
}

export const IsProxiedSymbol = Symbol('isProxied')

export function markResultAsProxied(result: any) {
  if (!result) return null

  for (const key in result) {
    const value = result[key]

    if (typeof value === 'object' && value != null) {
      markResultAsProxied(value)
    }
  }

  return Object.assign(result, {[IsProxiedSymbol]: true})
}

export function isSourceProxied<T>(source: T): source is T & {__typename?: string} {
  return (source as any)[IsProxiedSymbol] == true
}

export function createProxyingResolver<TSource, TContext, TArgs = {[argName: string]: any}>(
  resolver: GraphQLFieldResolver<TSource, TContext, TArgs>
): GraphQLFieldResolver<TSource, TContext, TArgs> {
  return (source, args, context, info) => {
    if (isSourceProxied(source)) {
      return (source as any)[info.path.key]
    }

    return resolver(source, args, context, info)
  }
}

export function createProxyingIsTypeOf<TSource, TContext>(
  isTypeOf: GraphQLIsTypeOfFn<TSource, TContext>
): GraphQLIsTypeOfFn<TSource, TContext> {
  return function (this: GraphQLObjectType, source, context, info) {
    return isSourceProxied(source)
      ? source.__typename === this.name
      : isTypeOf(source, context, info)
  }
}

export function mapEnumsBack(result: any) {
  if (!result) return null

  for (const key in result) {
    const value = result[key]

    if (typeof value === 'object' && value !== null) {
      mapEnumsBack(value)
    }
  }
  if (
    result.__typename === 'ArticleTeaser' ||
    result.__typename === 'PeerArticleTeaser' ||
    result.__typename === 'PageTeaser' ||
    result.__typename === 'EventTeaser' ||
    result.__typename === 'CustomTeaser'
  ) {
    switch (result.style) {
      case 'DEFAULT':
        return Object.assign(result, {style: TeaserStyle.Default})
      case 'LIGHT':
        return Object.assign(result, {style: TeaserStyle.Light})
      case 'TEXT':
        return Object.assign(result, {style: TeaserStyle.Text})
    }
  }
  return result
}

class ResetGraphQLEnums implements Transform {
  transformResult(result: ExecutionResult) {
    // FIXME: WPC-415 created
    return mapEnumsBack(result)
  }
}

export async function delegateToPeerSchema(
  peerID: string,
  fetchAdminEndpoint: boolean,
  context: Context,
  opts: Omit<IDelegateToSchemaOptions, 'schema'>
) {
  const schema = fetchAdminEndpoint
    ? await context.loaders.peerAdminSchema.load(peerID)
    : await context.loaders.peerSchema.load(peerID)

  if (!schema) return null

  return markResultAsProxied(
    await delegateToSchema({
      ...opts,
      schema,
      transforms: [new ResetGraphQLEnums(), ...(opts.transforms ?? [])]
    })
  )
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function countRichtextChars(blocksCharLength: number, nodes: any) {
  return nodes.reduce((charLength: number, node: any) => {
    if (!node.text && !node.children) return charLength
    if (node.text) {
      return charLength + (node.text as string).length
    }
    return countRichtextChars(charLength, node.children)
  }, blocksCharLength)
}

export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends Record<K, V>
  ? T
  : never

export type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>
}

export function isObject<T>(unknown: unknown): unknown is Record<any, T> {
  return typeof unknown === 'object' && unknown != null && !Array.isArray(unknown)
}

export function isArray<T>(unknown: unknown): unknown is T[] {
  return Array.isArray(unknown)
}

export function isString(unknown: unknown): unknown is string {
  return typeof unknown === 'string'
}

export function isBoolean(unknown: unknown): unknown is boolean {
  return typeof unknown === 'boolean'
}

export function mapEnumToGraphQLEnumValues(enumObject: unknown) {
  return Object.fromEntries(
    Object.keys(enumObject).map(key => [enumObject[key], {values: enumObject[key]}])
  )
}

/**
 * Parse rich text blocks to plain text. It allows to search in articles and pages for the whole content.
 * TODO: write migration for existing articles and pages. Implement function on all page mutations.
 * @param blocks
 * @returns
 */
export function blocksToSearchText(blocks?: (Block | any)[]): string | undefined {
  if (!blocks) {
    return
  }

  try {
    const richTextBlocks = blocks.filter(block => block.type === BlockType.RichText)

    return richTextBlocks.map(richTextBlock => toPlaintext(richTextBlock.richText)).join(' ')
  } catch (error) {
    console.log(error)
  }
}
