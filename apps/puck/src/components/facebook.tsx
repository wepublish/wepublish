import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import {
  FacebookConfig,
  FacebookVideoConfig,
  InstagramConfig,
} from './facebook.config';

export const Facebook = withLayout(withColor(FacebookConfig));
export const Instagram = withLayout(withColor(InstagramConfig));
export const FacebookVideo = withLayout(withColor(FacebookVideoConfig));
