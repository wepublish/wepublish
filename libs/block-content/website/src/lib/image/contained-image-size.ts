export function getContainedImageSize(
  img: HTMLImageElement,
  availableWidth = Number.POSITIVE_INFINITY
): [number, number] {
  const boxWidth = Math.min(img.width, availableWidth);
  const boxHeight = img.height;
  const ratio = img.naturalWidth / img.naturalHeight;

  if (!Number.isFinite(ratio) || ratio <= 0) {
    return [boxWidth, boxHeight];
  }

  let width = boxHeight * ratio;
  let height = boxHeight;

  if (width > boxWidth) {
    width = boxWidth;
    height = boxWidth / ratio;
  }

  return [width, height] as const;
}
