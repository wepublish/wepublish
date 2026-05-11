import {
  FullImageFragment,
  FullPeerImageFragment,
} from '@wepublish/website/api';
import nanoid from 'nanoid';

export const mockImage = () =>
  ({
    __typename: 'Image',
    id: nanoid(),
    mimeType: 'image/jpg',
    width: 4000,
    height: 6000,
    description: null,
    source: 'Source',
    link: null,
    license: null,
    focalPoint: {
      x: 0.5,
      y: 0.5,
    },
    title: null,
    xxl: 'https://unsplash.it/1500/500',
    xl: 'https://unsplash.it/1200/400',
    l: 'https://unsplash.it/1000/400',
    m: 'https://unsplash.it/800/400',
    s: 'https://unsplash.it/500/300',
    xs: 'https://unsplash.it/300/200',
    xxs: 'https://unsplash.it/200/100',
    xxlSquare: 'https://unsplash.it/1500/1500',
    xlSquare: 'https://unsplash.it/1200/1200',
    lSquare: 'https://unsplash.it/1000/1000',
    mSquare: 'https://unsplash.it/800/800',
    sSquare: 'https://unsplash.it/500/500',
    xsSquare: 'https://unsplash.it/300/300',
    xxsSquare: 'https://unsplash.it/200/200',
  }) as FullImageFragment;

export const mockPeerImage = () =>
  ({
    __typename: 'PeerImage',
    id: nanoid(),
    width: 4000,
    height: 6000,
    description: null,
    source: 'Source',
    link: null,
    license: null,
    focalPoint: {
      x: 0.5,
      y: 0.5,
    },
    title: null,
    xxl: 'https://unsplash.it/1500/500',
    xl: 'https://unsplash.it/1200/400',
    l: 'https://unsplash.it/1000/400',
    m: 'https://unsplash.it/800/400',
    s: 'https://unsplash.it/500/300',
    xs: 'https://unsplash.it/300/200',
    xxs: 'https://unsplash.it/200/100',
    xxlSquare: 'https://unsplash.it/1500/1500',
    xlSquare: 'https://unsplash.it/1200/1200',
    lSquare: 'https://unsplash.it/1000/1000',
    mSquare: 'https://unsplash.it/800/800',
    sSquare: 'https://unsplash.it/500/500',
    xsSquare: 'https://unsplash.it/300/300',
    xxsSquare: 'https://unsplash.it/200/200',
  }) as FullPeerImageFragment;
