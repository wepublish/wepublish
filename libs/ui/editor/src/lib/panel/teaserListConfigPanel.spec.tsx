import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { TeaserListBlockSort, TeaserType } from '@wepublish/editor/api';

import { TeaserListBlockValue } from '../blocks/types';
import { TeaserListConfigPanel } from './teaserListConfigPanel';

const theme = createTheme({ cssVariables: true });

const renderPanel = () =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <TeaserListConfigPanel
          value={
            {
              title: '',
              teaserType: TeaserType.Article,
              sort: TeaserListBlockSort.PublishedAt,
              skip: 0,
              take: 6,
              filter: { tags: [], tagObjects: [] },
              teasers: [],
            } as unknown as TeaserListBlockValue
          }
          onClose={vi.fn()}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    </MockedProvider>
  );

describe('TeaserListConfigPanel', () => {
  it('explains sorting and skipping next to the fields', () => {
    renderPanel();

    expect(screen.getByText('blocks.teaserList.sortInfo')).toBeVisible();
    expect(screen.getByText('blocks.teaserList.skipInfo')).toBeVisible();
  });

  it('lets the fields use the full width of the drawer', () => {
    renderPanel();

    expect(
      screen
        .getByRole('spinbutton', { name: 'blocks.teaserList.takeLabel' })
        .closest('.MuiTextField-root')
    ).not.toHaveStyle({ width: '200px' });
  });

  it('names the tags picker after its label', () => {
    renderPanel();

    expect(
      screen.getByRole('combobox', { name: 'blocks.teaserList.tagsLabel' })
    ).toBeInTheDocument();
  });

  it('shows closing the drawer as a text button', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'close' })).toHaveClass(
      'MuiButton-text'
    );
  });
});
