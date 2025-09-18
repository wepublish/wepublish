import {
  FullImageFragment,
  FullPeerImageFragment,
} from '@wepublish/website/api';
import { ImgHTMLAttributes } from 'react';

export type BuilderImageProviderProps = {
  square?: boolean;
  maxWidth?: BuilderImageWidths;
} & Pick<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'fetchPriority'>;

export type BuilderImageWidths = 200 | 300 | 500 | 800 | 1000 | 1200 | 1500;

export type BuilderImageProps = {
  image: FullImageFragment | FullPeerImageFragment;
} & BuilderImageProviderProps &
  Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet' | 'alt' | 'title' | 'width' | 'height'
  >;
