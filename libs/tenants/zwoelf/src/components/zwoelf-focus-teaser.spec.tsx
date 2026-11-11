import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockTeaserListBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';

import theme from '../theme';
import { zwoelfTenant } from '../zwoelf-tenant';
import { ZwoelfFocusTeaser } from './zwoelf-focus-teaser';

describe('ZwoelfFocusTeaser', () => {
  it('puts the title on the zwoelf green and the focused teaser on black', () => {
    renderWithProviders(
      <ZwoelfFocusTeaser
        {...mockTeaserListBlock({
          blockStyle: 'Focus',
          title: 'Im Fokus',
          teasers: [mockArticleTeaser({ title: 'Der Fokus-Artikel' })],
        })}
      />,
      { tenant: zwoelfTenant }
    );

    const titleBox = screen.getByRole('heading', { name: 'Im Fokus' })
      .parentElement as HTMLElement;
    const contentBox = titleBox.parentElement as HTMLElement;

    expect(getComputedStyle(titleBox).backgroundColor).toBe(
      theme.palette.primary.main
    );
    expect(getComputedStyle(contentBox).backgroundColor).toBe(
      theme.palette.secondary.main
    );
    expect(getComputedStyle(contentBox).color).toBe(
      theme.palette.secondary.contrastText
    );
    expect(
      screen.getByRole('heading', { name: 'Der Fokus-Artikel' })
    ).toBeInTheDocument();
  });
});
