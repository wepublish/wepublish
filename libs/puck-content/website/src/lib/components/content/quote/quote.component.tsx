import { BuilderQuoteBlockProps, QuoteBlock } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { firstDataImage } from '../data-images';

export type QuoteConfigProps = Omit<
  BuilderQuoteBlockProps,
  'image' | 'className'
>;

export const QuoteRender: PuckBlockComponent<QuoteConfigProps> = ({
  props,
  data,
  className,
}) => (
  <QuoteBlock
    {...props}
    image={firstDataImage(data)}
    className={className}
  />
);
