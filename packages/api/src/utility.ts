import url from 'url'
import fetch from 'cross-fetch'

import {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  print,
  GraphQLResolveInfo,
  GraphQLObjectType
} from 'graphql'

import {
  delegateToSchema,
  introspectSchema,
  makeRemoteExecutableSchema,
  Fetcher
} from 'graphql-tools'

import {Peer} from './db/peer'

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

export const IsProxiedSymbol = Symbol('isProxied')

export function markResultAsProxied(result: any) {
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

export async function delegateToPeerQuery(
  peer: Peer,
  info: GraphQLResolveInfo,
  isAdminQuery: boolean,
  fieldName: string,
  args?: {[key: string]: any}
) {
  const {hostURL, token} = peer
  const fetcher: Fetcher = async ({query: queryDocument, variables, operationName}) => {
    const query = print(queryDocument)
    const fetchResult = await fetch(url.resolve(hostURL, isAdminQuery ? 'admin' : ''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({query, variables, operationName})
    })

    return fetchResult.json()
  }

  const schema = makeRemoteExecutableSchema({
    schema: await introspectSchema(fetcher),
    fetcher
  })

  return markResultAsProxied(
    await delegateToSchema({
      schema: schema,
      operation: 'query',
      fieldName: fieldName,
      args,
      info
    })
  )
}
