export function getContainedImageSize(img: HTMLImageElement): [number, number] {
  const ratio = img.naturalWidth / img.naturalHeight;

  let width = img.height * ratio;
  let height = img.height;

  if (width > img.width) {
    width = img.width;
    height = img.width / ratio;
  }

  const parentWidth = img.parentElement?.clientWidth ?? 0;

  if (width > parentWidth) {
    width = parentWidth;
  }

  return [width, height] as const;
}
