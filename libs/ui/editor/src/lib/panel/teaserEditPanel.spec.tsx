import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { TeaserType } from '@wepublish/editor/api';

import { Teaser } from '../blocks/types';
import { TeaserEditPanel } from './teaserEditPanel';

const theme = createTheme({ cssVariables: true });

const articleTeaser = {
  type: TeaserType.Article,
  preTitle: '',
  title: '',
  lead: '',
  image: null,
  article: {
    id: 'a1',
    latest: {
      title: 'Original title',
      preTitle: 'Original pre-title',
      lead: 'Original lead',
      image: null,
    },
  },
} as unknown as Teaser;

const customTeaser = {
  type: TeaserType.Custom,
  title: 'Custom',
  preTitle: '',
  lead: '',
  image: null,
  contentUrl: 'https://example.com',
  openInNewTab: false,
  properties: [],
} as unknown as Teaser;

const renderPanel = (initialTeaser: Teaser) => {
  const onConfirm = vi.fn();

  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <TeaserEditPanel
          initialTeaser={initialTeaser}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      </ThemeProvider>
    </MockedProvider>
  );

  return onConfirm;
};

describe('TeaserEditPanel', () => {
  it('suggests the original texts as placeholders', () => {
    renderPanel(articleTeaser);

    expect(
      screen.getByRole('textbox', { name: 'articleEditor.panels.title' })
    ).toHaveAttribute('placeholder', 'Original title');
    expect(
      screen.getByRole('textbox', { name: 'articleEditor.panels.lead' })
    ).toHaveAttribute('placeholder', 'Original lead');
  });

  it('previews the teaser as it will look', () => {
    renderPanel(articleTeaser);

    expect(screen.getByText('Original title')).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('textbox', { name: 'articleEditor.panels.title' }),
      { target: { value: 'Better title' } }
    );

    expect(screen.getByText('Better title')).toBeInTheDocument();
  });

  it('opens custom links in a new tab via a checkbox', () => {
    const onConfirm = renderPanel(customTeaser);

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'articleEditor.panels.openInNewTab',
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'articleEditor.panels.confirm' })
    );

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ openInNewTab: true })
    );
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
