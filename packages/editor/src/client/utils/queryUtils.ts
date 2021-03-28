import {ContentModel, ContentModelSchema, ContentModelSchemas} from '@wepublish/api'
import gql from 'graphql-tag'
import {ContentModelSchemaTypes} from '../interfaces/apiTypes'

export const ContentModelPrefix = '_cm'
export const ContentModelPrefixPrivate = '_cmp'
export const ContentModelPrefixPrivateInput = '_cmpi'
const SEPARATOR = '_'

export function nameJoin(...slug: string[]) {
  return slug.join(SEPARATOR)
}

export function getCrudQueries(schema: ContentModel) {
  return {
    delete: getDeleteMutation(schema)
  }
}

export function getCreateMutation(schema: ContentModel) {
  return gql`
  ${getFragment(schema)}

  mutation CreateContent_${schema.identifier}($input: ${nameJoin(
    ContentModelPrefixPrivateInput,
    schema.identifier,
    'record',
    'create'
  )}!) {
    content {
      ${schema.identifier} {
        create(input: $input) {
          ...Content_${schema.identifier}
        }
      }
    }
  }
  `
}

export function getReadQuery(schema: ContentModel) {
  return gql`
  ${getFragment(schema)}

    query ReadContent_${schema.identifier}($id: ID!) {
      content {
        ${schema.identifier} {
          read(id: $id) {
            ...Content_${schema.identifier}
          }
        }
      }
    }
  `
}

export function getUpdateMutation(schema: ContentModel) {
  return gql`
  ${getFragment(schema)}

  mutation UpdateContent_${schema.identifier}($input: ${nameJoin(
    ContentModelPrefixPrivateInput,
    schema.identifier,
    'record',
    'update'
  )}!) {
    content {
      ${schema.identifier} {
        update(input: $input) {
          ...Content_${schema.identifier}
        }
      }
    }
  }  
  `
}

export function getDeleteMutation(schema: ContentModel) {
  return gql`
    mutation DeleteContent_${schema.identifier}($id: ID!) {
      content {
        ${schema.identifier} {
          delete(id: $id)
        }
      }
    }
  `
}

function getFragment(schema: ContentModel) {
  const fragmentName = nameJoin(ContentModelPrefixPrivate, schema.identifier, 'record')
  const fragment = `
    fragment Content_${schema.identifier} on ${fragmentName} {
      id
      revision
      state
      createdAt
      modifiedAt
      publicationDate
      dePublicationDate
      title
      shared
      ${getFragmentSchema(schema.schema, fragmentName)}
    }
  `
  return fragment
}

function getFragmentSchema(contentModelSchemas: ContentModelSchema, fragmentName: string) {
  return Object.entries(contentModelSchemas).reduce((accu, [key, val]) => {
    const n = nameJoin(fragmentName, key)
    const children = Object.entries(val).reduce((accu, [key, val]) => {
      accu += `${key} ${getFragmentSchemaRecursive(val as ContentModelSchemas, nameJoin(n, key))}\n`
      return accu
    }, '')

    accu += `${key} {\n${children}}`
    return accu
  }, '')
}

function getFragmentSchemaRecursive(schema: ContentModelSchemas, name: string = ''): string {
  switch (schema.type) {
    case ContentModelSchemaTypes.object:
      return `{
        ${Object.entries(schema.fields)
          .map(([key, val]) => {
            const ObjectName = nameJoin(name, key)
            return `${key} ${getFragmentSchemaRecursive(val, ObjectName)}`
          })
          .join('\n')}
      }`
    case ContentModelSchemaTypes.list:
      return getFragmentSchemaRecursive(schema.contentType, name)
    case ContentModelSchemaTypes.reference:
      return `{
        recordId
        contentType
        peerId
      }`
    case ContentModelSchemaTypes.union:
      return `{
        ${Object.entries(schema.cases)
          .map(([unionCase, val]) => {
            const unionCaseName = nameJoin(name, unionCase)
            return `... on ${unionCaseName} {
              ${unionCase} ${getFragmentSchemaRecursive(val, unionCaseName)}
            }`
          })
          .join('\n')}
      }`
    default:
      return ''
  }
}

export function stripTypename<T>(input: T) {
  const newish = {...input}

  for (const prop in newish) {
    if (prop === '__typename') delete newish[prop]
    else if (newish[prop] === null) {
    } else if (Array.isArray(newish[prop])) {
      for (const next in newish[prop]) {
        newish[prop][next] = stripTypename(newish[prop][next])
      }
    } else if (typeof newish[prop] === 'object') {
      newish[prop] = stripTypename(newish[prop])
    }
  }

  return newish
}
