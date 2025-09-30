import { MockedProvider } from '@apollo/client/testing';
import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { actWait } from '@wepublish/testing';
import * as stories from './invoice-list-container.stories';

const storiesCmp = composeStories(stories);

describe('InvoiceList Container', () => {
  beforeAll(() => {
    Object.defineProperty(global.window, 'location', {
      value: {
        href: 'http://localhost',
      },
    });
  });

  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(
        <MockedProvider {...Component.parameters?.apolloClient}>
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
