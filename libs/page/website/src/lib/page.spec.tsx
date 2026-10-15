import { render } from '@testing-library/react';
import * as stories from './page.stories';
import { composeStories } from '@storybook/react';
import {
  footerContainerClassName,
  navbarContainerClassName,
} from '@wepublish/website/builder';

const storiesCmp = composeStories(stories);

describe('Page', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  describe('header and footer', () => {
    const renderWithLayout = (Story: (typeof storiesCmp)['Default']) =>
      render(
        <>
          <nav
            data-testid="navbar"
            className={navbarContainerClassName}
          />
          <Story />
          <footer
            data-testid="footer"
            className={footerContainerClassName}
          />
        </>
      );

    it('shows them by default', () => {
      const { getByTestId } = renderWithLayout(storiesCmp.Default);

      expect(getComputedStyle(getByTestId('navbar')).display).not.toBe('none');
      expect(getComputedStyle(getByTestId('footer')).display).not.toBe('none');
    });

    it('hides them when the page asks for it', () => {
      const { getByTestId } = renderWithLayout(
        storiesCmp.WithHiddenHeaderFooter
      );

      expect(getComputedStyle(getByTestId('navbar')).display).toBe('none');
      expect(getComputedStyle(getByTestId('footer')).display).toBe('none');
    });
  });
});
