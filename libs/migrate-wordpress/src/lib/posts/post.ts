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
import {deleteExistingPosts} from './index'

export async function migratePost(data: PreparedArticleData) {
  const {title, lead, content, createdAt, modifiedAt, slug, link, featuredMedia} = data

  const existingArticle = await getArticleBySlug(slug)
  if (existingArticle) {
    console.debug('  article exists', slug)
    if (deleteExistingPosts) {
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

    const slateContent = await convertNodeContentToRichText(node)

    const isSlateNodeEmpty = (slateNode: any[]) => {
      const isEmpty = (node: any): boolean => {
        if (node?.text === '') {
          return true
        }
        if (node?.type === 'paragraph' && node?.children?.every(isEmpty)) {
          return true
        }
        return false
      }
      return slateNode.every(isEmpty)
    }
    if (isSlateNodeEmpty(slateContent)) {
      continue
    }

    const lastBlock = blocks[blocks.length - 1]
    const hasParagraphs = (block: BlockInput) =>
      block.richText && block.richText.richText.some((node: any) => node.type === 'paragraph')
    if (lastBlock?.richText && !hasParagraphs(lastBlock)) {
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
