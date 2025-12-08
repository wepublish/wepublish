import { withColor } from '../blocks/color';
import { withLayout } from '../blocks/layout';
import { ListicleConfig } from './listicle.config';

export const Listicle = withLayout(withColor(ListicleConfig));
