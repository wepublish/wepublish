import {
  FullImageFragment,
  FullPeerImageFragment,
} from '@wepublish/website/api';
import { faker } from './faker';
import { definedOnly } from './overrides';

type WithKey<T> = Partial<T> & { key?: string };

const imageUrl = (size: string, key?: string) =>
  `https://unsplash.it/${size}${key ? `?key=${key}` : ``}`;

export const mockImage = (
  keyOrOverrides: string | WithKey<FullImageFragment> = {}
): FullImageFragment => {
  const { key, ...overrides }: WithKey<FullImageFragment> =
    typeof keyOrOverrides === 'string' ?
      { key: keyOrOverrides }
    : keyOrOverrides;

  return {
    __typename: 'Image',
    id: faker.string.nanoid(),
    width: 4000,
    height: 6000,
    description: null,
    source: 'Source',
    link: null,
    license: null,
    focalPointX: 0.5,
    focalPointY: 0.5,
    title: null,
    url: imageUrl('500/281', key),
    xxxl: imageUrl('2400/800', key),
    xxl: imageUrl('1500/500', key),
    xl: imageUrl('1200/400', key),
    l: imageUrl('1000/400', key),
    m: imageUrl('800/400', key),
    s: imageUrl('500/300', key),
    xs: imageUrl('300/200', key),
    xxs: imageUrl('200/100', key),
    xxxlSquare: imageUrl('2400/2400', key),
    xxlSquare: imageUrl('1500/1500', key),
    xlSquare: imageUrl('1200/1200', key),
    lSquare: imageUrl('1000/1000', key),
    mSquare: imageUrl('800/800', key),
    sSquare: imageUrl('500/500', key),
    xsSquare: imageUrl('300/300', key),
    xxsSquare: imageUrl('200/200', key),
    ...definedOnly(overrides),
  };
};

export const mockPeerImage = (
  keyOrOverrides: string | WithKey<FullPeerImageFragment> = {}
): FullPeerImageFragment => {
  const { key, ...overrides }: WithKey<FullPeerImageFragment> =
    typeof keyOrOverrides === 'string' ?
      { key: keyOrOverrides }
    : keyOrOverrides;

  return {
    __typename: 'PeerImage',
    id: faker.string.nanoid(),
    width: 4000,
    height: 6000,
    description: null,
    focalPointX: 0.5,
    focalPointY: 0.5,
    title: null,
    xxl: imageUrl('1500/500', key),
    xl: imageUrl('1200/400', key),
    l: imageUrl('1000/400', key),
    m: imageUrl('800/400', key),
    s: imageUrl('500/300', key),
    xs: imageUrl('300/200', key),
    xxs: imageUrl('200/100', key),
    xxlSquare: imageUrl('1500/1500', key),
    xlSquare: imageUrl('1200/1200', key),
    lSquare: imageUrl('1000/1000', key),
    mSquare: imageUrl('800/800', key),
    sSquare: imageUrl('500/500', key),
    xsSquare: imageUrl('300/300', key),
    xxsSquare: imageUrl('200/200', key),
    ...definedOnly(overrides),
  };
};
