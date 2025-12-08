import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { EventConfig } from './event.config';

export const Event = withLayout(withColor(EventConfig));
