import {ensureImage} from './image'
import cheerio, {Cheerio, CheerioAPI, load, Element} from 'cheerio'
import {BlockInput, Image} from '../../api/private'
import {convertHtmlToSlate} from './convert-html-to-slate'
import {extractEmbed} from './embeds'
import {Node as SlateNode} from 'slate'

type Node = {
  $: CheerioAPI
  element: Element
  $element: Cheerio<Element>
  specialEl: Element
  $specialEl: Cheerio<Element>
}

export function extractContentNodes(content: string): Node[] {
  const $ = load(content)
  const elements = $('body > *')
  const specialTags = [
    '.woocommerce-info',
    'iframe',
    'figure',
    'img',
    'blockquote',
    '.content-box',
    '.content-box-gelb'
  ]

  const nodes = []
  for (const element of elements) {
    const $element = $(element)
    const $wrapper = $(element).wrap('<div></div>').parent()
    const specialEl = $wrapper.find(specialTags.join(', '))[0]
    $element.unwrap()
    const $specialEl = $(specialEl)

    nodes.push({
      $,
      element,
      $element,
      specialEl,
      $specialEl
    })
  }
  return nodes
}

export async function extractImageGallery({$element}: Node): Promise<BlockInput[]> {
  const imageGallery = true
  const imageSingles = false
  if (imageGallery) {
    return [
      {
        imageGallery: {
          images: await Promise.all(
            $element.find('img').map(async (i, img) => {
              const $img = $element.find(img)
              const image = await ensureImageFromImg($img)
              return {
                imageID: image.id
              }
            })
          )
        }
      }
    ]
  }

  if (imageSingles) {
    return await Promise.all(
      $element.find('img').map(async (i, img) => {
        const $img = $element.find(img)
        const image = await ensureImage({
          url: $img.attr('data-src')!,
          title: $img.attr('alt')!,
          description: $img.attr('alt')!
        })
        return {
          image: {
            imageID: image.id
          }
        }
      })
    )
  }
  return []
}

export async function extractFigure({$specialEl}: Node): Promise<BlockInput> {
  const $img = $specialEl.find('img')
  const image = await ensureImageFromImg($img)
  return {
    image: {
      imageID: image.id,
      caption: image.description
    }
  }
}

export async function extractIframe({$, $specialEl}: Node): Promise<BlockInput[]> {
  if ($specialEl.attr('src')) {
    return [extractEmbed($.html($specialEl).toString())]
  }
  return []
}

export async function extractContentBox({$specialEl, $}: Node): Promise<BlockInput[]> {
  const blocks: BlockInput[] = []

  // extract image
  const $imageTag = $specialEl.find('img')
  if ($imageTag.length) {
    const image = await ensureImageFromImg($imageTag)
    $imageTag.parentsUntil('.content-box, .content-box-gelb').remove()
    blocks.push({
      image: {
        imageID: image.id,
        caption: image.description
      }
    })
  }

  // extract potential iframes
  const $iframes = $specialEl.find('iframe')
  $iframes.parent().remove()

  // extract richText
  const richText = (await convertHtmlToSlate($specialEl.html()!)) as unknown as SlateNode[]

  // create rich text block
  blocks.push({
    richText: {
      richText
    }
  })

  // create iframe blocks
  $iframes.map((i, iframe) => {
    blocks.push(extractEmbed($.html(iframe).toString()))
  })
  return blocks
}

export function extractBlockquoteOrEmbed({$specialEl}: Node): BlockInput {
  const content = $specialEl.html()!
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

export async function ensureImageFromImg($img: Cheerio<Element>) {
  return await ensureImage({
    url: $img.attr('data-src')!,
    title: $img.attr('alt')!,
    description: $img.attr('alt')!
  })
}

export function prepareImageBlock(image: Pick<Image, 'id' | 'description'>) {
  return {
    image: {
      imageID: image.id,
      caption: image.description
    }
  }
}

export function prepareTitleBlock({title, subtitle}: {title: string; subtitle: string}) {
  return {
    title: {
      title,
      lead: subtitle
    }
  }
}

export async function convertNodeContentToRichText({element, $}: Node) {
  return (await convertHtmlToSlate($.html(element).toString())) as unknown as SlateNode[]
}
