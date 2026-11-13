import { createTheme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';

import { AuthorListItemImageWrapper } from './reflekt-author-list-item';

const PHONE_WIDTH = 390;

describe('reflekt author list item image', () => {
  beforeEach(() => {
    window.happyDOM.setViewport({ width: PHONE_WIDTH, height: 844 });
  });

  it('fills the card on a phone instead of shrinking to an avatar', () => {
    const { container } = render(
      <ThemeProvider theme={createTheme()}>
        <AuthorListItemImageWrapper />
      </ThemeProvider>
    );

    const wrapper = container.firstElementChild as HTMLElement;

    expect(window.innerWidth).toBe(PHONE_WIDTH);
    expect(getComputedStyle(wrapper).width).toBe('100%');
    expect(getComputedStyle(wrapper).maxWidth).not.toBe('120px');
  });
});
