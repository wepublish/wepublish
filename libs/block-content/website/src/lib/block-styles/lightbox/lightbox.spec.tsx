import { fireEvent, render, screen } from '@testing-library/react';
import * as stories from './lightbox.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Lightbox', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('should keep the fullscreen styles when the stylesheets load in a different order', () => {
    const { container } = render(<storiesCmp.SingleImage />);

    fireEvent.click(screen.getByRole('button', { name: 'Vollbild' }));

    const styleTags = [...document.head.querySelectorAll('style')];
    styleTags.reverse().forEach(tag => document.head.appendChild(tag));

    const image = container.querySelector('img') as HTMLImageElement;
    const innerWrapper = container.querySelector('figure > div') as HTMLElement;

    expect(getComputedStyle(image).objectFit).toBe('contain');
    expect(getComputedStyle(innerWrapper).gridTemplateRows).toBe('1fr auto');
  });
});
