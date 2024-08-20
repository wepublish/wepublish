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
import {fetchPost, fetchPosts, WordpressAuthor, WordpressPost} from './wordpress-api'
import {ensureTagsForPost} from './tags'

type ImageInput = {
  url: string
  title: string
  description?: string
}

const deleteBeforeMigrate = true

const ensureAuthor = async (author: WordpressAuthor): Promise<{id: string}> => {
  const {slug, link, url, name, description, avatar_urls} = author

  const existingAuthor = await getAuthorBySlug(author.slug)
  if (existingAuthor) {
    console.log('  author exists', slug)
    return existingAuthor
  }

  const image = await ensureImage({
    url: avatar_urls['96'],
    title: name
  })

  console.log('  author create', slug)
  return await createAuthor({
    name,
    slug,
    links: [{title: 'Link', url: link}],
    imageID: image.id
  })
}

const ensureImage = async (input: ImageInput) => {
  const {url, title, description} = input

  const foundImages = (await getImagesByTitle(title)).nodes
  const existingImage = foundImages.find(image => image.link === url)
  if (existingImage) {
    console.log('  image exists', url)
    return existingImage
  }

  console.log('  create image', url)
  const image = await createImage({
    downloadUrl: url,
    filename: new URL(url).pathname.split('/').pop() as string,
    title,
    link: url,
    description
  })

  return {
    id: image.id!,
    title,
    description
  }
}

const removeLinks = (html: string) => {
  const $ = cheerio.load(html)
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

const migratePost = async (post: WordpressPost) => {
  const {
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

  let featuredImage
  const title = decode(encodedTitle)
  const lead = removeLinks(excerpt)

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

  // Tags
  const tagIds = await ensureTagsForPost(post.id)

  // Title
  blocks.push({
    title: {
      title,
      lead: subtitle
    }
  })

  // Featured image
  if (_embedded?.['wp:featuredmedia']?.length) {
    const featuredMedia = _embedded?.['wp:featuredmedia'][0]
    featuredImage = await ensureImage({
      url: featuredMedia.source_url,
      title: featuredMedia.title.rendered,
      description: removeLinks(featuredMedia.caption.rendered)
    })
    blocks.push({
      image: {
        imageID: featuredImage.id,
        caption: featuredImage.description
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
            title: $(specialEl).attr('alt')!,
            description: $(specialEl).attr('alt')!
          })
          blocks.push({
            image: {
              imageID: image.id,
              caption: image.description
            }
          })
          break
        case 'figure':
          image = await ensureImage({
            url: $(specialEl).find('img').attr('data-src')!,
            title: $(specialEl).find('img').attr('alt')!,
            description: $(specialEl).find('figcaption').text()!
          })
          blocks.push({
            image: {
              imageID: image.id,
              caption: image.description
            }
          })
          break
        case 'iframe':
          if ($(specialEl).attr('src')) {
            blocks.push(extractEmbed($.html(specialEl).toString()))
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
    tags: tagIds,
    title,
    lead,
    slug,
    // preTitle: subtitle,
    imageID: featuredImage ? featuredImage.id : undefined,
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

export const migratePosts = async (limit?: number) => {
  console.log('Migrating general articles', {limit})
  const BATCH_SIZE = process.env['BATCH_SIZE'] ?? 1
  let postsMigrated = 0
  for (let page = 1; ; page++) {
    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts({
      page,
      perPage: +BATCH_SIZE
    })
    if (batch.length === 0) break

    for (const post of batch) {
      if (limit !== undefined && postsMigrated >= limit) {
        return
      }
      await migratePost(post)
      postsMigrated++
    }
  }
}

export const migratePostsFromCategory = async (categoryId: number, limit?: number) => {
  console.log('Migrating category articles', {categoryId, limit})
  const BATCH_SIZE = process.env['BATCH_SIZE'] ?? 1
  let postsMigrated = 0
  for (let page = 1; ; page++) {
    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts({
      categoryId,
      page,
      perPage: +BATCH_SIZE
    })
    if (batch.length === 0) break

    for (const post of batch) {
      if (limit !== undefined && postsMigrated >= limit) {
        return
      }
      await migratePost(post)
      postsMigrated++
    }
  }
}
export const migratePostById = async (...ids: number[]) => {
  for (const id of ids) {
    const post = await fetchPost(id)
    await migratePost(post)
  }
}
