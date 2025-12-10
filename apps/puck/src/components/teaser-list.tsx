import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { TeaserListConfig } from './teaser-list.config';

export const TeaserList = withLayout(withColor(TeaserListConfig));
