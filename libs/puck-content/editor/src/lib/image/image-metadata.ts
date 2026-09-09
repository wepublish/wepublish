import { captureException } from '@sentry/react';
import exifr from 'exifr';

export type ImageMetaData = {
  title?: string;
  description?: string;
  source?: string;
  link?: string;
  license?: string;
};

const metaTagMap: Record<keyof ImageMetaData, string[]> = {
  title: ['Headline', 'title.value'],
  description: ['ImageDescription', 'description.value', 'Caption'],
  source: ['Copyright', 'CopyrightNotice', 'rights.value'],
  link: ['WebStatement'],
  license: [],
};

const findNestedTag = (tags: unknown, path: string): unknown => {
  return path.split('.').reduce<unknown>((base, key) => {
    if (base && typeof base === 'object' && key in base) {
      return (base as Record<string, unknown>)[key];
    }

    return undefined;
  }, tags);
};

export const readImageMetaData = async (file: File): Promise<ImageMetaData> => {
  const fields: ImageMetaData = {};

  try {
    const tags = await exifr.parse(file, true);

    for (const [field, paths] of Object.entries(metaTagMap)) {
      for (const path of paths) {
        const value = findNestedTag(tags, path);

        if (typeof value === 'string' && value.trim()) {
          fields[field as keyof ImageMetaData] = value.trim();
          break;
        }
      }
    }
  } catch (error) {
    console.error(error);
    captureException(error);
  }

  return fields;
};
