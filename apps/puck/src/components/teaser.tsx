import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { TeaserConfig } from './teaser.config';

export const Teaser = withLayout(withColor(TeaserConfig));
