/**
 * Image URLs by id, for the canvas. Filled from the newsletter query on load
 * and from the picker when an image is chosen, so a block that stores only
 * an image id can still be drawn.
 */
const cache = new Map<string, string>();

export function rememberImages(images: { id: string; url: string }[]): void {
  for (const image of images) {
    cache.set(image.id, image.url);
  }
}

export function lookupImageUrl(id: string | undefined): string | undefined {
  return id ? cache.get(id) : undefined;
}
