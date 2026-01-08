import {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  GraphQLObjectType,
} from 'graphql';
import {
  delegateToSchema,
  IDelegateToSchemaOptions,
  Transform,
} from '@graphql-tools/delegate';
import { ExecutionResult } from '@graphql-tools/utils';
import { Context } from './context';

export function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

export function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString();
}

export const IsProxiedSymbol = Symbol('isProxied');

export function markResultAsProxied(result: any) {
  if (!result) return null;

  for (const key in result) {
    const value = result[key];

    if (typeof value === 'object' && value != null) {
      markResultAsProxied(value);
    }
  }

  return Object.assign(result, { [IsProxiedSymbol]: true });
}

export function isSourceProxied<T>(
  source: T
): source is T & { __typename?: string } {
  return (source as any)[IsProxiedSymbol] == true;
}

export function createProxyingResolver<
  TSource,
  TContext,
  TArgs = { [argName: string]: any },
>(
  resolver: GraphQLFieldResolver<TSource, TContext, TArgs>
): GraphQLFieldResolver<TSource, TContext, TArgs> {
  return (source, args, context, info) => {
    if (isSourceProxied(source)) {
      return (source as any)[info.path.key];
    }

    return resolver(source, args, context, info);
  };
}

export function createProxyingIsTypeOf<TSource, TContext>(
  isTypeOf: GraphQLIsTypeOfFn<TSource, TContext>
): GraphQLIsTypeOfFn<TSource, TContext> {
  return function (this: GraphQLObjectType, source, context, info) {
    return isSourceProxied(source) ?
        source.__typename === this.name
      : isTypeOf(source, context, info);
  };
}

export function mapEnumsBack(result: any) {
  if (!result) return null;

  for (const key in result) {
    const value = result[key];

    if (typeof value === 'object' && value !== null) {
      mapEnumsBack(value);
    }
  }

  return result;
}

class ResetGraphQLEnums implements Transform {
  transformResult(result: ExecutionResult) {
    // FIXME: WPC-415 created
    return mapEnumsBack(result);
  }
}

export async function delegateToPeerSchema(
  peerID: string,
  fetchAdminEndpoint: boolean,
  context: Context,
  opts: Omit<IDelegateToSchemaOptions, 'schema'>
) {
  const schema =
    fetchAdminEndpoint ?
      await context.loaders.peerAdminSchema.load(peerID)
    : await context.loaders.peerSchema.load(peerID);

  if (!schema) return null;

  return markResultAsProxied(
    await delegateToSchema({
      ...opts,
      schema,
      transforms: [new ResetGraphQLEnums(), ...(opts.transforms ?? [])],
    })
  );
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function lowercaseFirstLetter(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function countRichtextChars(blocksCharLength: number, nodes: any) {
  return nodes.reduce((charLength: number, node: any) => {
    if (!node.text && !node.children) return charLength;
    if (node.text) {
      return charLength + (node.text as string).length;
    }
    return countRichtextChars(charLength, node.children);
  }, blocksCharLength);
}

export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> =
  T extends Record<K, V> ? T : never;

export type MapDiscriminatedUnion<
  T extends Record<K, string>,
  K extends keyof T,
> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>;
};

export function isObject<T>(unknown: unknown): unknown is Record<any, T> {
  return (
    typeof unknown === 'object' && unknown != null && !Array.isArray(unknown)
  );
}

export function isArray<T>(unknown: unknown): unknown is T[] {
  return Array.isArray(unknown);
}

export function isString(unknown: unknown): unknown is string {
  return typeof unknown === 'string';
}

export function isBoolean(unknown: unknown): unknown is boolean {
  return typeof unknown === 'boolean';
}

export function mapEnumToGraphQLEnumValues(
  enumObject: Record<string, unknown>
) {
  return Object.fromEntries(
    Object.keys(enumObject).map(key => [
      enumObject[key],
      { values: enumObject[key] },
    ])
  );
}
