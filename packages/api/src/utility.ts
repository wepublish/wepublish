import {GraphQLFieldResolver, GraphQLIsTypeOfFn, GraphQLObjectType} from 'graphql'

import {delegateToSchema, IDelegateToSchemaOptions, Transform, ExecutionResult} from 'graphql-tools'

import {Context} from './context'
import {TeaserStyle} from './db/block'

// https://gist.github.com/mathewbyrne/1280286#gistcomment-2588056
export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]/gi, 'a')
    .replace(/[ÇĆĈČ]/gi, 'c')
    .replace(/[ÐĎĐÞ]/gi, 'd')
    .replace(/[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]/gi, 'e')
    .replace(/[ĜĞĢǴ]/gi, 'g')
    .replace(/[ĤḦ]/gi, 'h')
    .replace(/[ÌÍÎÏĨĪĮİỈỊ]/gi, 'i')
    .replace(/[Ĵ]/gi, 'j')
    .replace(/[Ĳ]/gi, 'ij')
    .replace(/[Ķ]/gi, 'k')
    .replace(/[ĹĻĽŁ]/gi, 'l')
    .replace(/[Ḿ]/gi, 'm')
    .replace(/[ÑŃŅŇ]/gi, 'n')
    .replace(/[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]/gi, 'o')
    .replace(/[Œ]/gi, 'oe')
    .replace(/[ṕ]/gi, 'p')
    .replace(/[ŔŖŘ]/gi, 'r')
    .replace(/[ßŚŜŞŠ]/gi, 's')
    .replace(/[ŢŤ]/gi, 't')
    .replace(/[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]/gi, 'u')
    .replace(/[ẂŴẀẄ]/gi, 'w')
    .replace(/[ẍ]/gi, 'x')
    .replace(/[ÝŶŸỲỴỶỸ]/gi, 'y')
    .replace(/[ŹŻŽ]/gi, 'z')
    .replace(/[·/_,:;\\']/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
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
    result.__typename === 'PageTeaser'
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
      schema: schema,
      transforms: [new ResetGraphQLEnums(), ...(opts.transforms ?? [])]
    })
  )
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function validateCommentLength (comment: any) {
  let charCount = 0;
  for (let i = 0; i < comment.text.length; i++) {
    charCount += comment.text[i].children[i].text.length
    if (charCount > 1000) {
      throw new Error(`Comment Length should be maximum of 1000 characters`)
      return [];
    }
  }
}

export const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000
export const ONE_DAY_IN_MILLISECONDS = 24 * ONE_HOUR_IN_MILLISECONDS
