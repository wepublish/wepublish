import { PuckComponent } from '@puckeditor/core';
import { PollBlockProvider } from '@wepublish/block-content/website';
import { BuilderPollBlockProps, PollBlock } from '@wepublish/website/builder';

export const PollRender: PuckComponent<BuilderPollBlockProps> = props => (
  <PollBlockProvider>
    {props.poll && <PollBlock {...props} />}
  </PollBlockProvider>
);
