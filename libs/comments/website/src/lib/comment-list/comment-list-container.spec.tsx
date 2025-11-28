import { MockedProvider } from '@apollo/client/testing';
import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { actWait } from '@wepublish/testing';
import * as stories from './comment-list-container.stories';

const storiesCmp = composeStories(stories);

describe('CommentList Container', () => {
  Object.entries(storiesCmp).forEach(([story, Component], index) => {
    it(`should render ${story}`, async () => {
      const { container } = render(
        <MockedProvider
          {...Component.parameters?.apolloClient}
          key={index}
        >
          <Component />
        </MockedProvider>
      );

      await actWait();

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
