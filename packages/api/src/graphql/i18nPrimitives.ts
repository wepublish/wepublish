import {isObject} from '@karma.run/utility'
import {GraphQLScalarType, valueFromASTUntyped} from 'graphql'
import {LanguageConfig} from '../interfaces/languageConfig'

let graphQLi18nString: GraphQLScalarType
export function getGraphQLi18nString(languageConfig: LanguageConfig) {
  if (graphQLi18nString) {
    return graphQLi18nString
  }

  function serialize(value: {[lang: string]: any}): any {
    if (!isObject(value)) {
      throw Error(`Expected object, found ${value}.`)
    }

    // TODO schema validation
    return Object.entries(value).reduce((accu, [lang, val]) => {
      const r = languageConfig.languages.find(i => i.id === lang)
      accu[r!.tag] = val
      return accu
    }, {} as any)
  }

  function parse(value: {[lang: string]: any}): any {
    if (!isObject(value)) {
      throw Error(`Expected object, found ${value}.`)
    }

    // TODO schema validation
    return Object.entries(value).reduce((accu, [lang, val]) => {
      const r = languageConfig.languages.find(i => i.tag === lang)
      accu[r!.id] = val
      return accu
    }, {} as any)
  }

  graphQLi18nString = new GraphQLScalarType({
    name: 'i18nString',
    description: `i18 String which supports the following languages: ${languageConfig.languages
      .map(r => r.tag)
      .join(',')}`,
    serialize(value) {
      return serialize(value)
    },
    parseValue(value) {
      return parse(value)
    },
    parseLiteral(literal) {
      const obj = valueFromASTUntyped(literal)
      return parse(obj)
    }
  })
  return graphQLi18nString
}
