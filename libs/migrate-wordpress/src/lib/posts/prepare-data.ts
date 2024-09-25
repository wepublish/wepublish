import {fetchCategoryBranch, fetchTag, WordpressAuthor, WordpressPost} from './wordpress-api'
import {decode} from 'html-entities'
import {load} from 'cheerio'

export type PreparedArticleData = {
  id: number
  title: string
  subtitle: string
  lead: string
  content: string
  createdAt: Date
  modifiedAt: Date
  slug: string
  link: string
  tags: TagInput[]
  authors: WordpressAuthor[]
  featuredMedia?: {
    url: string
    title: string
    description: string
  }
}

export async function prepareArticleData(post: WordpressPost): Promise<PreparedArticleData> {
  const {
    id,
    title: {rendered: encodedTitle},
    excerpt: {rendered: excerpt},
    content: {rendered: content},
    date_gmt,
    modified_gmt,
    categories: categoryIds,
    tags: tagIds,
    wps_subtitle: subtitle,
    slug,
    link,
    _embedded
  } = post
  const title = decode(encodedTitle)
  const lead = removeLinks(excerpt)

  // Featured media
  let featuredMedia
  if (_embedded?.['wp:featuredmedia']?.length) {
    const featuredMediaData = _embedded?.['wp:featuredmedia'][0]
    if (featuredMediaData.source_url && featuredMediaData.title) {
      featuredMedia = {
        url: featuredMediaData.source_url,
        title: featuredMediaData.title.rendered,
        description: removeLinks(featuredMediaData.caption?.rendered ?? '')
      }
    }
  }

  // Tags
  const tags = await prepareTags(tagIds, categoryIds)

  return {
    id,
    title,
    subtitle,
    lead,
    tags,
    content,
    createdAt: new Date(date_gmt + 'Z'),
    modifiedAt: new Date(modified_gmt + 'Z'),
    slug,
    link,
    authors: _embedded?.author ?? [],
    featuredMedia
  }
}

type TagInput = {
  name: string
  main?: boolean
}

async function prepareTags(tagIds: number[], categoryIds: number[]) {
  const categories = (await Promise.all(categoryIds.map(id => fetchCategoryBranch(id)))).flat()
  const tags = await Promise.all(tagIds.map(id => fetchTag(id)))

  return [
    ...categories.map(({name, parent}) => ({
      name: decode(name),
      main: !parent
    })),
    ...tags.map(({name}) => ({
      name,
      main: false
    }))
  ]
}

function removeLinks(html: string) {
  const $ = load(html)
  $('a').remove()
  return decode($.text())
}
