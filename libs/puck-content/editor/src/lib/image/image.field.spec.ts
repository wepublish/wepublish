import type { ComponentData } from '@puckeditor/core';

import {
  appendImageIds,
  attachUploadedImage,
  canAddImages,
  ImageListTarget,
  imageSortKeys,
  moveImageId,
  removeImageIdAt,
} from './image.field';

describe('appendImageIds', () => {
  it('appends new images in order', () => {
    expect(appendImageIds(['a'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('skips images that are already there', () => {
    expect(appendImageIds(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('stops at the maximum', () => {
    expect(appendImageIds(['a'], ['b', 'c'], 2)).toEqual(['a', 'b']);
  });
});

describe('canAddImages', () => {
  it('allows any number without a maximum', () => {
    expect(canAddImages(['a', 'b'])).toBe(true);
  });

  it('allows adding until the maximum is reached', () => {
    expect(canAddImages(['a'], 2)).toBe(true);
    expect(canAddImages(['a', 'b'], 2)).toBe(false);
  });
});

describe('removeImageIdAt', () => {
  it('removes only the image at the position', () => {
    expect(removeImageIdAt(['a', 'b', 'a'], 2)).toEqual(['a', 'b']);
  });
});

describe('moveImageId', () => {
  it('moves an image forward', () => {
    expect(moveImageId(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an image backward', () => {
    expect(moveImageId(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
});

describe('imageSortKeys', () => {
  it('gives every position a key that survives reordering', () => {
    expect(imageSortKeys(['a', 'b'])).toEqual(['a', 'b']);
    expect(imageSortKeys(['b', 'a'])).toEqual(['b', 'a']);
  });

  it('keeps keys unique when an image appears twice', () => {
    expect(imageSortKeys(['a', 'b', 'a'])).toEqual(['a', 'b', 'a#2']);
  });
});

describe('attachUploadedImage', () => {
  const gallery = (id: string, ids: string[] | undefined): ComponentData => ({
    type: 'Gallery',
    props: { id, title: id, images: ids },
  });

  const target: ImageListTarget = {
    read: props => props['images'],
    write: (props, ids) => ({ ...props, images: ids }),
  };

  const lookup = (items: ComponentData[]) => ({
    getItemById: (id: string) => items.find(item => item.props.id === id),
    getSelectorForId: (id: string) => {
      const index = items.findIndex(item => item.props.id === id);

      return index < 0 ? undefined : { index, zone: 'root:default-zone' };
    },
  });

  it('appends the image to the block that started the upload', () => {
    const puck = lookup([gallery('a', ['i1']), gallery('b', ['x1'])]);

    expect(attachUploadedImage(puck, 'a', target, 'i2')).toEqual({
      type: 'replace',
      destinationIndex: 0,
      destinationZone: 'root:default-zone',
      data: gallery('a', ['i1', 'i2']),
    });
  });

  it('keeps the maximum of the block', () => {
    const puck = lookup([gallery('a', ['i1'])]);

    expect(attachUploadedImage(puck, 'a', target, 'i2', 1)).toEqual(
      expect.objectContaining({ data: gallery('a', ['i1']) })
    );
  });

  it('writes nothing when the block is gone or no longer holds images', () => {
    const puck = lookup([gallery('a', undefined)]);

    expect(attachUploadedImage(puck, 'deleted', target, 'i2')).toBeUndefined();
    expect(attachUploadedImage(puck, 'a', target, 'i2')).toBeUndefined();
  });
});
