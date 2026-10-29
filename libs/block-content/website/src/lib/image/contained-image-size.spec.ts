import { getContainedImageSize } from './contained-image-size';

const image = (
  width: number,
  height: number,
  naturalWidth: number,
  naturalHeight: number
) => ({ width, height, naturalWidth, naturalHeight }) as HTMLImageElement;

describe('getContainedImageSize', () => {
  it('fits a portrait image into its box by height', () => {
    expect(getContainedImageSize(image(800, 600, 400, 600))).toEqual([
      400, 600,
    ]);
  });

  it('fits a landscape image into its box by width', () => {
    expect(getContainedImageSize(image(800, 600, 1600, 400))).toEqual([
      800, 200,
    ]);
  });

  it('limits the width to the available width', () => {
    expect(getContainedImageSize(image(800, 600, 1600, 400), 400)).toEqual([
      400, 100,
    ]);
  });

  it('returns the box while the image has not loaded', () => {
    expect(getContainedImageSize(image(800, 600, 0, 0), 500)).toEqual([
      500, 600,
    ]);
  });
});
