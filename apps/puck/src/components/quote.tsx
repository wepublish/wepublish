import { withColor } from '../blocks/color';
import { withLayout } from '../blocks/layout';
import { QuoteConfig } from './quote.config';

export const Quote = withLayout(withColor(QuoteConfig));
