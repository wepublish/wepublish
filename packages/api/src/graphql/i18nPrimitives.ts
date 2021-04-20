import {
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLObjectType,
  GraphQLOutputType
} from 'graphql'
import {LanguageConfig} from '../interfaces/languageConfig'
import {nameJoin} from './content/contentUtils'

interface InputCache {
  [key: string]: GraphQLInputObjectType
}
interface OutputCache {
  [key: string]: GraphQLObjectType
}

const inputTypes: InputCache = {}
export function getI18nInputType(
  graphQLType: GraphQLInputType,
  languageConfig: LanguageConfig
): GraphQLInputObjectType {
  const type = graphQLType.toString()
  if (type in inputTypes) {
    return inputTypes[type]
  }
  inputTypes[type] = new GraphQLInputObjectType({
    name: nameJoin('i18n', type, 'input'),
    fields: languageConfig.languages.reduce((accu, language) => {
      accu[language.tag] = {type: graphQLType}
      return accu
    }, {} as GraphQLInputFieldConfigMap)
  })
  return inputTypes[type]
}

const outputTypes: OutputCache = {}
export function getI18nOutputType(
  graphQLType: GraphQLOutputType,
  languageConfig: LanguageConfig
): GraphQLObjectType {
  const type = graphQLType.toString()
  if (type in outputTypes) {
    return outputTypes[type]
  }
  outputTypes[type] = new GraphQLObjectType({
    name: nameJoin('i18n', type),
    fields: languageConfig.languages.reduce((accu, language) => {
      accu[language.tag] = {type: graphQLType}
      return accu
    }, {} as GraphQLFieldConfigMap<any, any, any>)
  })
  return outputTypes[type]
}
