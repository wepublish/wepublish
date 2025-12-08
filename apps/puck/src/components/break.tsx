import { withLayout } from '../blocks/layout';
import { withColor } from '../blocks/color';
import { BreakConfig } from './break.config';

export const Break = withLayout(withColor(BreakConfig));
