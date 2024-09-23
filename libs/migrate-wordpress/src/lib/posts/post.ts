import {deleteArticle, ensureArticle, getArticleBySlug} from './article'
import {ensureTags} from './tags'
import {BlockInput} from '../../api/private'
import {
  convertNodeContentToRichText,
  extractBlockquoteOrEmbed,
  extractContentBox,
  extractContentNodes,
  extractFigure,
  extractIframe,
  extractImageGallery,
  prepareImageBlock,
  prepareTitleBlock
} from './blocks'
import {ensureImage} from './image'
import {convertHtmlToSlate} from './convert-html-to-slate'
import {Node as SlateNode} from 'slate'
import {ensureAuthor} from './author'
import {PreparedArticleData} from './prepare-data'

const deleteBeforeMigrate = true

export async function migratePost(data: PreparedArticleData) {
  const {title, lead, content, createdAt, modifiedAt, slug, link, featuredMedia} = data

  const existingArticle = await getArticleBySlug(slug)
  if (existingArticle) {
    console.debug('  article exists', slug)
    if (deleteBeforeMigrate) {
      console.debug('  article delete', slug)
      await deleteArticle(existingArticle.id)
    } else {
      return existingArticle
    }
  }

  // Tags
  const tags = await ensureTags(data)

  // Authors
  const authors = await ensureAuthors(data)

  const blocks: BlockInput[] = []

  // Title
  blocks.push(prepareTitleBlock(data))

  // Featured media
  let featuredImage
  if (featuredMedia) {
    featuredImage = await ensureImage(featuredMedia)
    blocks.push(prepareImageBlock(featuredImage))
  }

  const nodes = extractContentNodes(content)
  for (const node of nodes) {
    const {specialEl, $specialEl, $element} = node

    if (specialEl) {
      // Img
      if ('img' === specialEl.tagName) {
        console.error(`img tag, please check post ${data.id}`)
        blocks.push(...(await extractImageGallery(node)))
        continue
      }

      // Figure
      if ('figure' === specialEl.tagName) {
        blocks.push(await extractFigure(node))
        continue
      }

      // Iframe
      if ('iframe' === specialEl.tagName) {
        blocks.push(...(await extractIframe(node)))
        continue
      }

      // Quotes
      if ('blockquote' === specialEl.tagName) {
        blocks.push(extractBlockquoteOrEmbed(node))
        continue
      }

      // Content box
      if ($specialEl.filter('.content-box, .content-box-gelb').length) {
        blocks.push(...(await extractContentBox(node)))
        continue
      }
    }

    // Elements surrounded with <hr> tags
    if ($element.filter('p').length && $element.prev('hr').length && $element.next('hr').length) {
      const skipHrSurroundedLinks = true
      if (!skipHrSurroundedLinks) {
        const richText = await convertHtmlToSlate<SlateNode>($element.html()!)
        blocks.push({
          linkPageBreak: {
            richText,
            hideButton: true
          }
        })
      }
      continue
    }

    // Use html to create RichText block or add it to the last block (if was RichText block)
    const slateContent = await convertNodeContentToRichText(node)
    const lastBlock = blocks[blocks.length - 1]
    const richTextBlockCount = blocks.filter(b => b.richText).length
    const isRichTextBlockWithParagraphs = (block: BlockInput) => {
      return (
        block.richText && block.richText.richText.some((node: any) => node.type === 'paragraph')
      )
    }
    // This will add content to last block if it exists,
    // but only if it is not the only richtext block, or the block has no paragraphs yet
    if (
      lastBlock?.richText &&
      (richTextBlockCount > 1 || !isRichTextBlockWithParagraphs(lastBlock))
    ) {
      lastBlock?.richText.richText.push(...slateContent)
    } else {
      blocks.push({richText: {richText: slateContent}})
    }
  }

  return await ensureArticle({
    title,
    lead,
    slug,
    featuredImage,
    tags,
    authors,
    blocks,
    createdAt,
    modifiedAt
  })
}

async function ensureAuthors({authors}: PreparedArticleData) {
  return Promise.all(authors.map(a => ensureAuthor(a)))
}