import axios from 'axios'
import cheerio from 'cheerio'
import {
  createArticle,
  createAuthor,
  deleteArticle,
  getAuthorBySlug,
  getImagesByTitle,
  publishArticle
} from './private-api'
import {getArticleBySlug} from './public-api'
import {BlockInput} from '../api/private'
import {Node} from 'slate'
import {convertHtmlToSlate} from './convert-html-to-slate'
import {extractEmbed} from './embeds'
import {createImage} from './image-upload'
import {URL} from 'url'
import {decode} from 'html-entities'

type WordpressAuthor = {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls: {
    96: string
  }
}

interface WordPressPost {
  id: number
  title: {rendered: string}
  content: {rendered: string}
  excerpt: {rendered: string}
  date_gmt: string
  modified_gmt: string
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

const WORDPRESS_URL = process.env['WORDPRESS_URL'] + '/wp-json/wp/v2/posts'

const deleteBeforeMigrate = true

const fetchAuth = () => {
  if (process.env['WORDPRESS_USERNAME'] && process.env['WORDPRESS_PASSWORD']) {
    return {
      username: process.env['WORDPRESS_USERNAME'],
      password: process.env['WORDPRESS_PASSWORD']
    }
  }
  return undefined
}

const fetchPosts = async (page: number, perPage: number): Promise<WordPressPost[]> => {
  const response = await axios.get(WORDPRESS_URL, {
    auth: fetchAuth(),
    params: {page, per_page: perPage, _embed: true}
  })
  return response.data
}

const fetchPost = async (id: string): Promise<WordPressPost> => {
  const response = await axios.get(WORDPRESS_URL + '/' + id, {
    auth: fetchAuth(),
    params: {_embed: true}
  })
  return response.data
}

const ensureAuthor = async (author: WordpressAuthor): Promise<{id: string}> => {
  const {slug, link, url, name, description, avatar_urls} = author

  const existingAuthor = await getAuthorBySlug(author.slug)
  if (existingAuthor) {
    console.log('  author exists', slug)
    return existingAuthor
  }

  const image = await ensureImage({
    url: avatar_urls['96'],
    alt: name
  })

  console.log('  author create', slug)
  return await createAuthor({
    name,
    slug,
    links: [{title: 'Link', url: link}],
    imageID: image.id
  })
}

const ensureImage = async (input: WordpressImage) => {
  const {url, alt} = input

  const foundImages = (await getImagesByTitle(alt)).nodes
  const existingImage = foundImages.find(image => image.link === url)
  if (existingImage) {
    console.log('  image exists', url)
    return existingImage
  }

  console.log('  create image', url)
  const image = await createImage({
    downloadUrl: url,
    filename: new URL(url).pathname.split('/').pop() as string,
    title: alt,
    link: url
  })

  return {
    id: image.id!
  }
}

const prepareLead = (excerpt: string) => {
  const $ = cheerio.load(excerpt)
  $('a').remove()
  return decode($.text())
}

const extractBlockquote = (content: string): BlockInput => {
  const embedBlock = extractEmbed(content)
  if (JSON.stringify(embedBlock) === '{"embed":{}}') {
    return {
      quote: {
        quote: cheerio.load(content).text()
      }
    }
  }
  return embedBlock
}

const specialTags = ['.woocommerce-info', 'iframe', 'figure', 'blockquote']

const migratePost = async (post: WordPressPost) => {
  const {
    title: {rendered: encodedTitle},
    excerpt: {rendered: excerpt},
    content: {rendered: content},
    date_gmt,
    modified_gmt,
    slug,
    link,
    _embedded
  } = post

  const title = decode(encodedTitle)
  const lead = prepareLead(excerpt)

  console.log()
  console.log('========================================================================')
  console.log()
  console.log('Migrating article')
  console.log({title, slug, link})
  const existingArticle = await getArticleBySlug(slug)
  if (existingArticle) {
    console.log('  article exists', slug)
    if (deleteBeforeMigrate) {
      console.log('  article delete', slug)
      await deleteArticle(existingArticle.id)
    } else {
      return existingArticle
    }
  }

  let slateContent: Node[] | undefined
  let lastBlock: undefined | BlockInput
  const $ = cheerio.load(content)
  const blocks: BlockInput[] = []

  // Authors
  const authors = []
  for (const author of _embedded?.author ?? []) {
    authors.push(await ensureAuthor(author))
  }

  // Title
  blocks.push({
    title: {
      title,
      lead
    }
  })

  // Featured image
  if (_embedded?.['wp:featuredmedia']?.length) {
    const featuredImage = await ensureImage({
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
    let image, specialEl
    if (specialTags.includes(el.tagName)) {
      specialEl = el
    } else {
      specialEl = specialTags.map(tag => $(el).find(tag)[0]).find(e => e)
    }
    if (specialEl) {
      switch (specialEl.tagName) {
        case 'img':
          console.log('img...')
          console.log($.html(el).toString())
          console.log($(specialEl).attr('data-src'))
          image = await ensureImage({
            url: $(specialEl).attr('data-src')!,
            alt: $(specialEl).attr('alt')!
          })
          blocks.push({
            image: {
              imageID: image.id
            }
          })
          break
        case 'figure':
          image = await ensureImage({
            url: $(specialEl).find('img').attr('data-src')!,
            alt: $(specialEl).find('img').attr('alt')!
          })
          blocks.push({
            image: {
              imageID: image.id
            }
          })
          break
        case 'iframe':
          if ($(specialEl).attr('src')) {
            blocks.push(extractEmbed($(specialEl).attr('src')!))
          }
          break
        case 'blockquote':
          blocks.push(extractBlockquote($(specialEl).html()!))
          break
        case 'div':
        case 'p':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          break
      }
    } else {
      slateContent = (await convertHtmlToSlate($.html(el).toString())) as unknown as Node[]
      if (lastBlock?.richText) {
        lastBlock?.richText.richText.push(...slateContent)
      } else {
        blocks.push({richText: {richText: slateContent}})
      }
    }
    lastBlock = blocks[blocks.length - 1]
  }

  console.log('  article create', slug)
  blocks
    .map(block => {
      if (block.richText) {
        return {richtext: {richtext: '<content>'}}
      } else {
        return block
      }
    })
    .map(b => JSON.stringify(b))
    .forEach(b => console.log(`    ${b}`))

  const article = await createArticle({
    authorIDs: authors.map(a => a.id),
    breaking: false,
    hideAuthor: false,
    properties: [],
    shared: false,
    socialMediaAuthorIDs: [],
    tags: [],
    title,
    lead,
    slug,
    blocks: blocks.map(block => {
      if (block.richText) {
        return {
          richText: {
            richText: [
              {
                type: 'paragraph',
                children: block.richText.richText
              }
            ]
          }
        }
      }
      return block
    })
  })

  await publishArticle(article.id, new Date(date_gmt + 'Z'), new Date(modified_gmt + 'Z'))
  return article
}

export const migratePosts = async () => {
  const MAX_PAGES = process.env['MAX_PAGES'] ?? 1
  const BATCH_SIZE = process.env['BATCH_SIZE'] ?? 1
  for (let page = 1; !MAX_PAGES || page <= +MAX_PAGES; page++) {
    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts(page, +BATCH_SIZE)
    if (batch.length === 0) break

    for (const post of batch) {
      await migratePost(post)
    }
  }
}

export const migratePostById = async (id: string) => {
  const post = await fetchPost(id)
  await migratePost(post)
}
