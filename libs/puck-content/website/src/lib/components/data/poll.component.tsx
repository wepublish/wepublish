import { PuckComponent } from '@puckeditor/core';
import { PollBlockProvider } from '@wepublish/block-content/website';
import { BuilderPollBlockProps, PollBlock } from '@wepublish/website/builder';

export const PollRender: PuckComponent<BuilderPollBlockProps> = props => {
  // The block expects a loaded poll and has nothing to show without one
  if (!props.poll) {
    return null;
  }

  return (
    <PollBlockProvider>
      <PollBlock {...props} />
    </PollBlockProvider>
  );
};
