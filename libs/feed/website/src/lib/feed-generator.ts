import {Article} from '@wepublish/website/api'
import {Feed, Item} from 'feed'
import {getArticleSEO} from '@wepublish/article/website'
import {Node} from 'slate'
import {isRichTextBlock} from '@wepublish/block-content/website'
import {toHtml} from '@wepublish/richtext'

export const generateFeed =
  ({
    categories = [],
    ...config
  }: Omit<
    ConstructorParameters<typeof Feed>[0] & {
      categories?: string[]
    },
    'generator'
  >) =>
  (articles: Article[]) => {
    const items = articles.map(article => {
      const seo = getArticleSEO(article)

      const content = toHtml(
        article.blocks.reduce((acc, curr) => {
          if (isRichTextBlock(curr)) {
            acc.push(...curr.richText)
          }

          return acc
        }, [] as Node[])
      )

      return {
        title: seo.schema.headline,
        image: seo.schema.image,
        description: seo.schema.description,
        content,
        author: article.authors.map(author => ({
          name: author.name,
          link: author.url
        })),
        guid: article.id,
        link: article.url,
        date: new Date(article.publishedAt),
        category: article.tags.map(tag => ({
          name: tag,
          term: tag
        }))
      } as Item
    })

    const feed = new Feed({
      language: 'de',
      ...config,
      generator: 'We.Publish (https://github.com/wepublish/wepublish)'
    })

    for (const item of items) {
      feed.addItem(item)
    }

    for (const category of categories) {
      feed.addCategory(category)
    }

    return feed
  }
