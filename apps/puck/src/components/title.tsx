import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { TitleConfig } from './title.config';

export const Title = withLayout(withColor(TitleConfig));
