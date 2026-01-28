import exifr from 'exifr';

export type ImageMetaData = {
  [key: string]: string;
};

type metaTagsMap = {
  [key: string]: string[];
};

const DEFAULT_META_TAG_MAP: metaTagsMap = {
  title: ['Headline', 'title.value'],
  description: ['ImageDescription', 'description.value', 'Caption'],
  source: ['Copyright', 'CopyrightNotice', 'rights.value'],
  link: ['WebStatement'],
  licence: [],
};

function findNestedMetaFields(tags: any, tag: string) {
  const nestedTags = tag.split('.');
  let base = tags;
  for (const nestedTag of nestedTags) {
    if (base[nestedTag]) {
      base = base[nestedTag];
    } else {
      return false;
    }
  }
  return base;
}

export async function readImageMetaData(data: File): Promise<ImageMetaData> {
  const fields: ImageMetaData = {
    title: '',
    description: '',
    source: '',
    link: '',
    licence: '',
  };

  try {
    const tags = await exifr.parse(data, true);

    for (const field in DEFAULT_META_TAG_MAP) {
      for (const tag of DEFAULT_META_TAG_MAP[field]) {
        const foundTag = findNestedMetaFields(tags, tag);
        if (foundTag) {
          fields[field] = foundTag;
          break;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  return fields;
}
