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
    console.log('  author exists', slug)
    return existingAuthor
  }

  console.log('  author create', slug)
  return await createAuthor({
    name,
    slug,
    links: [{title: 'Link', url: link}]
  })
}

const ensureImage = async (input: WordpressImage) => {
  const {url, alt} = input

  const existingImage = (await getImagesByTitle(alt)).nodes.find(image => image.link === url)
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

const specialTags = ['iframe', 'figure', 'img', 'blockquote']

const migratePost = async (post: WordPressPost) => {
  const {
    title: {rendered: title},
    content: {rendered: content},
    date,
    slug,
    link,
    _embedded
  } = post

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

  let htmlContent: Node[] | undefined
  let lastBlock: undefined | BlockInput
  const $ = cheerio.load(content)
  const blocks: BlockInput[] = []

  // Authors
  const authors = []
  for (const author of _embedded?.author ?? []) {
    authors.push(await ensureAuthor(author))
  }

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
    // console.log(`${i}: ${el.tagName}`)
    // console.log($.html(el))

    if (specialTags.includes(el.tagName)) {
      specialEl = el
    } else {
      specialEl = specialTags.map(tag => $(el).find(tag)[0]).find(e => e)
    }
    // console.log({tag: el.tagName, specialTag: specialEl});

    // console.log(`${i}: ${el.tagName}`)
    // console.log($.html(el))
    if (specialEl) {
      switch (specialEl.tagName) {
        case 'img':
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
        case 'hr':
          break
        case 'blockquote':
          blocks.push(extractEmbed($(specialEl).html()!))
          break
        case 'p':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
      }
    } else {
      htmlContent = (await convertHtmlToSlate($.html(el).toString())) as unknown as Node[]
      if (lastBlock?.richText) {
        lastBlock?.richText.richText.push(...htmlContent)
      } else {
        blocks.push({richText: {richText: htmlContent}})
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

  await publishArticle(article.id)
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
