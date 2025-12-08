import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { HtmlConfig } from './html.config';

export const Html = withLayout(withColor(HtmlConfig));
