import { withLayout } from '../blocks/layout';

import { withColor } from '../blocks/color';
import { RichTextConfig } from './richtext.config';

export const RichText = withLayout(withColor(RichTextConfig));
