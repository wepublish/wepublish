import {ArticleInput, ArticleInputSchema} from './article/article'
import {ImageInput, ImageInputSchema} from './image/image'
import {LinksInput, LinksInputSchema} from './links/links'

export const domainFormMapping = [
  [LinksInputSchema, LinksInput],
  [ImageInputSchema, ImageInput],
  [ArticleInputSchema, ArticleInput]
] as const
