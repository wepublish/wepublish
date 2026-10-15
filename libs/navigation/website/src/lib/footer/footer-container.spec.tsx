import { MockedProvider } from '@apollo/client/testing/react';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { footerContainerClassName } from '@wepublish/website/builder';
import * as stories from './footer-container.stories';

const storiesCmp = composeStories(stories);

describe('Footer Container', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      );
    });
  });

  it('marks the rendered footer so pages can hide it', () => {
    const { Default } = storiesCmp;
    const { container } = render(
      <MockedProvider {...Default.parameters?.apolloClient}>
        <Default />
      </MockedProvider>
    );

    expect(
      container.querySelector(`.${footerContainerClassName}`)
    ).not.toBeNull();
  });
});
