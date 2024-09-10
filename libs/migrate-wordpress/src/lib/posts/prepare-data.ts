import {WordpressAuthor, WordpressPost} from './wordpress-api'
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
  authors: WordpressAuthor[]
  featuredMedia?: {
    url: string
    title: string
    description: string
  }
}

export function prepareArticleData(post: WordpressPost): PreparedArticleData {
  const {
    id,
    title: {rendered: encodedTitle},
    excerpt: {rendered: excerpt},
    content: {rendered: content},
    date_gmt,
    modified_gmt,
    wps_subtitle: subtitle,
    slug,
    link,
    _embedded
  } = post
  const title = decode(encodedTitle)
  const lead = removeLinks(excerpt)

  let featuredMedia
  if (_embedded?.['wp:featuredmedia']?.length) {
    const featuredMediaData = _embedded?.['wp:featuredmedia'][0]
    featuredMedia = {
      url: featuredMediaData.source_url,
      title: featuredMediaData.title.rendered,
      description: removeLinks(featuredMediaData.caption.rendered)
    }
  }

  return {
    id,
    title,
    subtitle,
    lead,
    content,
    createdAt: new Date(date_gmt + 'Z'),
    modifiedAt: new Date(modified_gmt + 'Z'),
    slug,
    link,
    authors: _embedded?.author ?? [],
    featuredMedia
  }
}

function removeLinks(html: string) {
  const $ = load(html)
  $('a').remove()
  return decode($.text())
}
