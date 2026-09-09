import { render } from '@testing-library/react';
import * as teaserListStories from './teaser-slider.teaser-list.stories';
import * as teaserGridStories from './teaser-slider.teaser-grid.stories';
import { composeStories } from '@storybook/react';

const teaserListStoriesCmp = composeStories(teaserListStories);
const teaserGridStoriesCmp = composeStories(teaserGridStories);

describe('Teaser Slider', () => {
  describe('Teaser List', () => {
    Object.entries(teaserListStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        render(<Component />);
      });
    });
  });

  describe('Teaser Grid', () => {
    Object.entries(teaserGridStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        render(<Component />);
      });
    });
  });
});
