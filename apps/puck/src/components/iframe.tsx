import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { IFrameConfig } from './iframe.config';

export const IFrame = withLayout(withColor(IFrameConfig));
