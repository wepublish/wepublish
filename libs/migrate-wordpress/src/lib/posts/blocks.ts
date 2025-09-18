import { ensureImage } from './image';
import cheerio, { Cheerio, CheerioAPI, load, Element } from 'cheerio';
import { BlockInput, Image } from '../../api/private';
import { extractEmbed } from './embeds';
import { isSlateNodeEmpty, transformHtmlToSlate } from './utils';
import { removeLinks } from './prepare-data';
import { publicClient } from '../api/clients';
import { BlockStyles, BlockStylesQuery } from '../../api/public';

type Node = {
  $: CheerioAPI;
  element: Element;
  $element: Cheerio<Element>;
  specialEl: Element;
  $specialEl: Cheerio<Element>;
};

export function extractContentNodes(content: string): Node[] {
  const $ = load(content);
  const elements = $('body > *');
  const specialTags = [
    '.woocommerce-info',
    'iframe',
    'figure',
    'img',
    'blockquote',
    '.content-box',
    '.content-box-gelb',
  ];

  const nodes = [];
  for (const element of elements) {
    const $element = $(element);
    const $wrapper = $(element).wrap('<div></div>').parent();
    const specialEl = $wrapper.find(specialTags.join(', '))[0];
    $element.unwrap();
    const $specialEl = $(specialEl);

    nodes.push({
      $,
      element,
      $element,
      specialEl,
      $specialEl,
    });
  }
  return nodes;
}

export async function extractImageGallery({
  $element,
}: Node): Promise<BlockInput[]> {
  const imgElements = $element.find('img');

  const imageGallery = imgElements.length > 1;
  const imageSingles = imgElements.length === 1;

  const images = (
    await Promise.all(
      imgElements
        .map(async (i, img) => {
          const $img = $element.find(img);
          if ($img.attr('width') === '1' || $img.attr('height') === '1') {
            return;
          }
          return await ensureImageFromImg($img);
        })
        .filter(img => !!img)
    )
  ).filter(i => i) as Image[];

  const blocks: BlockInput[] = [];

  imgElements.remove();
  if (imageGallery) {
    blocks.push({
      imageGallery: { images: images.map(({ id }) => ({ imageID: id })) },
    });
  }

  if (imageSingles) {
    blocks.push(
      ...(await Promise.all(
        images.map(({ id }) => ({ image: { imageID: id } }))
      ))
    );
  }

  const contentLeft = await transformHtmlToSlate($element.html()!);
  if (contentLeft.length) {
    blocks.push({
      richText: {
        richText: contentLeft,
      },
    });
  }

  return blocks;
}

export async function extractFigure({
  $specialEl,
}: Node): Promise<BlockInput[]> {
  const $img = $specialEl.find('img');
  const $figCaption = $specialEl.find('figcaption');

  const image = await ensureImage({
    url: $img.attr('data-src')!,
    title: $img.attr('alt')!,
    description: removeLinks($figCaption.text()),
  });
  if (!image) {
    return [];
  }
  return [
    {
      image: {
        imageID: image.id,
        caption: image.description,
      },
    },
  ];
}

export async function extractIframe({
  $,
  $specialEl,
}: Node): Promise<BlockInput[]> {
  if ($specialEl.attr('src')) {
    return [extractEmbed($.html($specialEl).toString())];
  }
  return [];
}

export async function extractContentBox({
  $specialEl,
  $,
}: Node): Promise<BlockInput[]> {
  const blocks: BlockInput[] = [];

  // get ContentBox ID
  const blockStyle = await findBlockStyle('ContentBox');
  if (!blockStyle) {
    throw new Error('ContentBox block style not found');
  }

  // extract image
  const $imageTag = $specialEl.find('img');
  if ($imageTag.length) {
    const image = await ensureImageFromImg($imageTag);
    $imageTag.parentsUntil('.content-box, .content-box-gelb').remove();
    if (image) {
      blocks.push({
        image: {
          imageID: image.id,
          caption: image.description,
          blockStyle: blockStyle.id,
        },
      });
    }
  }

  // extract potential iframes
  const $iframes = $specialEl.find('iframe');
  $iframes.parent().remove();

  // extract richText
  const richText = await transformHtmlToSlate($specialEl.html()!);

  // create rich text block
  if (!isSlateNodeEmpty(richText)) {
    blocks.push({
      richText: {
        richText,
        blockStyle: blockStyle.id,
      },
    });
  }

  // create iframe blocks
  $iframes.map((i, iframe) => {
    blocks.push(extractEmbed($.html(iframe).toString(), blockStyle.id));
  });
  return blocks;
}

export function extractBlockquoteOrEmbed({ $specialEl }: Node): BlockInput {
  const content = $specialEl.html()!;
  const embedBlock = extractEmbed(content);
  if (JSON.stringify(embedBlock) === '{"embed":{}}') {
    return {
      quote: {
        quote: cheerio.load(content).text(),
      },
    };
  }
  return embedBlock;
}

export async function ensureImageFromImg($img: Cheerio<Element>) {
  return await ensureImage({
    url: $img.attr('data-src')!,
    title: $img.attr('alt')!,
    description: $img.attr('alt')!,
  });
}

export function prepareImageBlock(image: Pick<Image, 'id' | 'description'>) {
  return {
    image: {
      imageID: image.id,
      caption: image.description,
    },
  };
}

export function prepareTitleBlock({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return {
    title: {
      title,
      lead: subtitle,
    },
  };
}

export async function convertNodeContentToRichText({ element, $ }: Node) {
  return await transformHtmlToSlate($.html(element).toString());
}

async function findBlockStyle(name: string) {
  return (
    await publicClient.request<BlockStylesQuery>(BlockStyles)
  ).blockStyles.find(blockStyle => blockStyle.name === name);
}
