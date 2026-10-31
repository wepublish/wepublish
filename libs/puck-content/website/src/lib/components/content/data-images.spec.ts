import { mockImage } from '@wepublish/mocks/website';

import { emptyPuckBlockData, PuckBlockData } from '../../blocks/block.types';
import { dataImageById, firstDataImage } from './data-images';

const harbour = mockImage({ id: 'harbour' });
const forest = mockImage({ id: 'forest' });

const withImages: PuckBlockData = {
  ...emptyPuckBlockData,
  images: [harbour, forest],
};

describe('firstDataImage', () => {
  it('returns the first image the datasource yields', () => {
    expect(firstDataImage(withImages)).toBe(harbour);
  });

  it('returns null without images', () => {
    expect(firstDataImage(emptyPuckBlockData)).toBeNull();
    expect(firstDataImage({ ...emptyPuckBlockData, images: [] })).toBeNull();
  });
});

describe('dataImageById', () => {
  it('finds an image of the data by its id', () => {
    expect(dataImageById(withImages, 'forest')).toBe(forest);
  });

  it('returns null for an unknown, empty or missing id', () => {
    expect(dataImageById(withImages, 'desert')).toBeNull();
    expect(dataImageById(withImages, '')).toBeNull();
    expect(dataImageById(withImages, undefined)).toBeNull();
    expect(dataImageById(emptyPuckBlockData, 'forest')).toBeNull();
  });
});
