import { render } from '@testing-library/react';
import * as stories from './streamable-video-block.stories';
import { composeStories } from '@storybook/react';
import { StreamableVideoBlock } from './streamable-video-block';

const storiesCmp = composeStories(stories);

describe('Streamable Video Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('should render nothing without a video id', () => {
    const { container } = render(<StreamableVideoBlock videoID={undefined} />);

    expect(container.firstChild).toBeNull();
  });
});
