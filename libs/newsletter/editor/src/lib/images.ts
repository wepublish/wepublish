import type { FullImageFragment } from '@wepublish/editor/api';

/**
 * The media-library images the open issue uses, by id. A block stores the id
 * alone; the canvas and the image field read the picture from here. Filled from
 * the campaign's `images` on load and from every pick in the media library.
 */
const cache = new Map<string, FullImageFragment>();

export const rememberImages = (images: FullImageFragment[]) => {
  for (const image of images) {
    cache.set(image.id, image);
  }
};

export const lookupImage = (id: string | undefined) =>
  id ? cache.get(id) : undefined;
