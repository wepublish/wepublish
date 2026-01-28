import { render } from '@testing-library/react';
import * as stories from './image-upload.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('ImageUpload', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
