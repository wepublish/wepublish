import axios from 'axios'
import cheerio from 'cheerio'
import {Image} from '@wepublish/api'
import {
  createArticle,
  createAuthor,
  deleteArticle,
  getAuthorBySlug,
  publishArticle
} from './private-api'
import {getArticleBySlug} from './public-api'
import {BlockInput} from '../api/private'
import {Node} from 'slate'
import {convertHtmlToSlate} from './convert-html-to-slate'

type WordpressAuthor = {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
}

interface WordPressPost {
  id: number
  title: {rendered: string}
  content: {rendered: string}
  date: string
  slug: string
  link: string
  _embedded?: {
    'wp:featuredmedia'?: [
      {
        source_url: string
        alt_text: string
      }
    ]
    author: WordpressAuthor[]
  }
}

type WordpressImage = {
  url: string
  alt: string
}

const WP_API_URL = 'https://mannschaft.com/wp-json/wp/v2/posts'
const BATCH_SIZE = 10

const deleteBeforeMigrate = true

const fetchPosts = async (page: number, perPage: number): Promise<WordPressPost[]> => {
  const response = await axios.get(WP_API_URL, {
    params: {page, per_page: perPage, _embed: true}
  })
  return response.data
}

const ensureAuthor = async (author: WordpressAuthor): Promise<{id: string}> => {
  const {slug, link, url, name, description} = author

  const existingAuthor = await getAuthorBySlug(author.slug)
  if (existingAuthor) {
    console.log('author exists', slug)
    return existingAuthor
  }

  console.log('author create', slug)
  return await createAuthor({
    name,
    slug,
    links: [{title: 'Link', url: link}]
  })
}

const createImage = async (image: WordpressImage): Promise<Image> => {
  console.log('create image')
  return {
    id: image.url,
    title: image.alt
  } as Image
}

const migratePost = async (post: WordPressPost) => {
  const {
    title: {rendered: title},
    content: {rendered: content},
    date,
    slug,
    link,
    _embedded
  } = post

  const existingArticle = await getArticleBySlug(slug)
  if (existingArticle) {
    console.log('article exists', slug)
    if (deleteBeforeMigrate) {
      console.log('article delete', slug)
      await deleteArticle(existingArticle.id)
    } else {
      return existingArticle
    }
  }

  let htmlContent: Node[] | undefined
  let src: string | undefined
  let lastBlock: undefined | BlockInput
  const $ = cheerio.load(content)
  const blocks: BlockInput[] = []

  // Authors
  const authors = []
  for (const author of _embedded?.author ?? []) {
    authors.push(await ensureAuthor(author))
  }

  if (_embedded?.['wp:featuredmedia']?.length) {
    const featuredImage = await createImage({
      url: _embedded?.['wp:featuredmedia'][0].source_url,
      alt: _embedded?.['wp:featuredmedia'][0].alt_text
    })

    blocks.push({
      image: {
        imageID: featuredImage.id
      }
    })
  }

  const nodes = $('body').children()

  for (const el of nodes) {
    let image
    // console.log(`${i}: ${el.tagName}`)
    // console.log($.html(el))
    switch (el.tagName) {
      // case 'img':
      case 'figure':
        image = await createImage({
          url: $(el).find('img').attr('data-src') ?? '',
          alt: ''
        })
        blocks.push({
          image: {
            imageID: image.id
          }
        })
        break
      case 'iframe':
        src = $(el).attr('src')
        if (src?.includes('youtube.com') || src?.includes('youtu.be')) {
          blocks.push({
            youTubeVideo: {
              videoID: src
            }
          })
        } else if (src?.includes('vimeo.com')) {
          blocks.push({
            vimeoVideo: {
              videoID: src
            }
          })
        } else {
          blocks.push({
            embed: {
              url: src
            }
          })
        }
        break
      case 'hr':
        break
      case 'p':
      case 'blockquote':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      default:
        htmlContent = (await convertHtmlToSlate($.html(el).toString())) as unknown as Node[]
        if (lastBlock?.richText) {
          lastBlock?.richText.richText.push(...htmlContent)
        } else {
          blocks.push({richText: {richText: htmlContent}})
        }
        break
    }
    lastBlock = blocks[blocks.length - 1]
  }

  console.log('article create', slug)
  const article = await createArticle({
    authorIDs: authors.map(a => a.id),
    breaking: false,
    hideAuthor: false,
    properties: [],
    shared: false,
    socialMediaAuthorIDs: [],
    tags: [],
    title,
    slug,
    blocks
  })

  await publishArticle(article.id)
  console.log(article)
  return article
}

export const migratePosts = async () => {
  let page = 1
  for (;;) {
    const batch = await fetchPosts(page, BATCH_SIZE)
    if (batch.length === 0) break

    for (const post of batch) {
      await migratePost(post)
    }
    return

    page += 1
  }
}
