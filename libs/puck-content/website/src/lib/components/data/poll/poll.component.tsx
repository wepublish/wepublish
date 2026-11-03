import { PollBlockProvider } from '@wepublish/block-content/website';
import { BuilderPollBlockProps, PollBlock } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';

export const PollRender: PuckBlockComponent<BuilderPollBlockProps> = ({
  props,
  className,
}) => (
  <PollBlockProvider>
    {props.poll && (
      <PollBlock
        {...props}
        className={className}
      />
    )}
  </PollBlockProvider>
);
