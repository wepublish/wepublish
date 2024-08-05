import axios from 'axios'
import cheerio from 'cheerio'
import {BlockType, BlockWithoutJSON, RichTextNode} from '@wepublish/api'
import {htmlToSlate} from 'slate-serializers'

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
    author: {
      id: number
      name: string
      url: string
      description: string
      link: string
      slug: string
    }[]
  }
}

interface MigratedArticle {
  title: string
  date: string
  slug: string
  link: string
  authors: string[]
  content: BlockWithoutJSON[]
}

const WP_API_URL = 'https://mannschaft.com/wp-json/wp/v2/posts'
const BATCH_SIZE = 10

const fetchPosts = async (page: number, perPage: number): Promise<WordPressPost[]> => {
  const response = await axios.get(WP_API_URL, {
    params: {page, per_page: perPage, _embed: true}
  })
  return response.data
}

const migratePost = (post: WordPressPost): MigratedArticle => {
  const {title, content, date, slug, link, _embedded} = post

  let htmlContent: RichTextNode | undefined
  let src: string | undefined
  let lastBlock: undefined | BlockWithoutJSON
  const $ = cheerio.load(content.rendered)
  const blocks: BlockWithoutJSON[] = []

  if (_embedded?.['wp:featuredmedia']?.length) {
    blocks.push({
      type: BlockType.Image,
      imageID: _embedded?.['wp:featuredmedia'][0].source_url,
      caption: _embedded?.['wp:featuredmedia'][0].alt_text
    })
  }

  $('body')
    .children()
    .each((i, el: any) => {
      // console.log(`${i}: ${el.tagName}`)
      // console.log($.html(el))
      switch (el.tagName) {
        // case 'img':
        case 'figure':
          blocks.push({
            type: BlockType.Image,
            imageID: $(el).find('img').attr('data-src')
          })
          break
        case 'iframe':
          src = $(el).attr('src')
          if (src?.includes('youtube.com') || src?.includes('youtu.be')) {
            blocks.push({
              type: BlockType.YouTubeVideo,
              videoID: src
            })
          } else if (src?.includes('vimeo.com')) {
            blocks.push({
              type: BlockType.VimeoVideo,
              videoID: src
            })
          } else {
            blocks.push({
              type: BlockType.Embed,
              url: src
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
          htmlContent = htmlToSlate($.html(el).toString())[0] as unknown as RichTextNode
          if (lastBlock?.type === BlockType.RichText) {
            lastBlock.richText.push(htmlContent)
          } else {
            blocks.push({type: BlockType.RichText, richText: [htmlContent]})
          }
          break
      }
      lastBlock = blocks[blocks.length - 1]
    })

  return {
    title: title.rendered,
    date,
    slug,
    link,
    authors: _embedded?.author?.map(a => a.name) ?? [],
    content: blocks
  }
}

const migratePosts = async () => {
  let page = 1
  const posts: WordPressPost[] = []

  for (;;) {
    const batch = await fetchPosts(page, BATCH_SIZE)
    if (batch.length === 0) break

    for (const post of batch) {
      const migratedPost = migratePost(post)
      console.log(JSON.stringify(migratedPost, undefined, '  '))
    }

    page += 1
  }
}

migratePosts().catch(error => console.error('Migration failed:', error))
