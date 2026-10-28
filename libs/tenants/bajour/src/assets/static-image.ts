export type StaticImage = string | { src: string };

export const staticImageSrc = (image: StaticImage) =>
  typeof image === 'string' ? image : image.src;
