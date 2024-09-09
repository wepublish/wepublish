import {createUniqueFieldSchema} from '@ts-react/form'

import {z} from 'zod'
import {createSelectInputSchema} from '../../form/select/select'
import {HiddenInputSchema} from '../../form/hidden/hidden'
import {ArrayInput} from '../array/array'
import {useCallback} from 'react'
import {ArticleInputSchema} from '../article/article'

const LINKS_BRANDING = 'links'

const baseLinkSchema = z.object({
  id: HiddenInputSchema.optional(),
  label: z.string().describe('Label').nullish(),
  type: createSelectInputSchema(z.enum(['external', 'article', 'page'])).describe('Type')
})

const externalLinkSchema = baseLinkSchema.merge(
  z.object({
    url: z.string().url().nullish().describe('URL')
  })
)

const pageLinkSchema = baseLinkSchema.merge(
  z.object({
    pageId: z.string().nullish().describe('Page')
  })
)

const articleLinkSchema = baseLinkSchema.merge(
  z.object({
    articleId: ArticleInputSchema.nullish().describe('Article')
  })
)

const linkSchema = z.union([externalLinkSchema, pageLinkSchema, articleLinkSchema])
export const LinksInputSchema = createUniqueFieldSchema(z.array(linkSchema), LINKS_BRANDING)

export function LinksInput() {
  const getDefaultItem = useCallback(() => ({type: 'external'}), [])
  const getSubFormProps = useCallback(
    (link: z.infer<typeof linkSchema>) => ({
      schema:
        (link.type === 'article' && articleLinkSchema) ||
        (link.type === 'page' && pageLinkSchema) ||
        externalLinkSchema,
      props: {
        type: {
          items: [
            {value: 'external', label: 'External'},
            {value: 'article', label: 'Article'},
            {value: 'page', label: 'Page'}
          ]
        }
      }
    }),
    []
  )

  return <ArrayInput getDefaultItem={getDefaultItem} getSubFormProps={getSubFormProps} />
}
