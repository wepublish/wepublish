import {FormSchemaMapping} from '@wepublish/website/form-builder'
import {ArticleInput, ArticleInputSchema} from './article/article'
import {ImageInput, ImageInputSchema} from './image/image'
import {LinksInput, LinksInputSchema} from './links/links'

export const domainFormMapping: FormSchemaMapping = [
  [LinksInputSchema, LinksInput],
  [ImageInputSchema, ImageInput],
  [ArticleInputSchema, ArticleInput]
] as const
