import { Config, createUsePuck, Data, Puck, UiState } from '@puckeditor/core';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { blockLibraryPlugin } from './block-library';

const usePuck = createUsePuck();

const CustomIcon = () => <svg data-testid="custom-icon" />;

const config: Config = {
  components: {
    Title: {
      category: 'text',
      nameKey: 'puck.blocks.names.Title',
      order: 1,
      render: () => <h1>Title</h1>,
    },
    RichText: {
      category: 'text',
      nameKey: 'puck.blocks.names.RichText',
      order: 2,
      render: () => <p>Text</p>,
    },
    Image: {
      category: 'media',
      nameKey: 'puck.blocks.names.Image',
      order: 1,
      render: () => <img alt="" />,
    },
    Custom: {
      category: 'media',
      nameKey: 'puck.blocks.names.Lightbox',
      order: 2,
      icon: CustomIcon,
      render: () => <div>Custom</div>,
    },
    Container: {
      category: 'layout',
      nameKey: 'puck.blocks.names.Container',
      order: 1,
      fields: { content: { type: 'slot' } },
      render: ({ content: Content }) => <Content />,
    },
    Teaser: {
      category: 'teaser',
      nameKey: 'puck.blocks.names.Teaser',
      order: 1,
      fields: { content: { type: 'slot' } },
      render: ({ content: Content }) => <Content />,
    },
    TeaserTitle: {
      category: 'teaser',
      group: 'teaserParts',
      nameKey: 'puck.blocks.names.TeaserTitle',
      order: 1,
      render: () => <h2>Teaser title</h2>,
    },
    Legacy: { label: 'Legacy block', render: () => <div>Legacy</div> },
  },
};

const data: Data = { root: { props: {} }, content: [] };

function Content() {
  const content = usePuck(puck => puck.appState.data.content);

  return (
    <div data-testid="content">{content.map(({ type }) => type).join(',')}</div>
  );
}

const renderLibrary = (ui?: Partial<UiState>, initial = data) =>
  render(
    <Puck
      config={config}
      data={initial}
      ui={ui}
      plugins={[blockLibraryPlugin]}
    >
      <Puck.Components />
      <Content />
    </Puck>
  );

const tile = (name: string) => screen.findByRole('button', { name });

describe('BlockLibrary', () => {
  beforeEach(() => localStorage.clear());

  it('remembers collapsed categories', async () => {
    const { unmount } = renderLibrary();

    fireEvent.click(await screen.findByRole('button', { name: /^Media/ }));
    unmount();
    renderLibrary();

    expect(
      await screen.findByRole('button', { name: /^Media/ })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('groups the blocks into named categories', async () => {
    renderLibrary();

    const text = await screen.findByRole('region', { name: 'Text' });

    expect(
      await within(text).findByRole('button', { name: 'Title' })
    ).toBeVisible();
    expect(within(text).getAllByRole('button', { name: 'Text' })).toHaveLength(
      2
    );
    expect(
      await within(screen.getByRole('region', { name: 'Media' })).findByRole(
        'button',
        { name: 'Image' }
      )
    ).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Recommended' })
    ).not.toBeInTheDocument();
  });

  it('takes the name, icon and category from the component config', async () => {
    renderLibrary();

    const media = await screen.findByRole('region', { name: 'Media' });
    const custom = await within(media).findByRole('button', {
      name: 'Gallery',
    });

    expect(within(custom).getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('lists blocks without a category under Other', async () => {
    renderLibrary();

    const other = await screen.findByRole('region', { name: 'Other' });

    expect(
      await within(other).findByRole('button', { name: 'Legacy block' })
    ).toBeVisible();
  });

  it('offers each block once to assistive technology', async () => {
    renderLibrary();

    await screen.findByRole('button', { name: 'Title' });

    expect(screen.getAllByRole('button', { name: 'Title' })).toHaveLength(1);
  });

  it('labels the teaser parts as only working inside a teaser', async () => {
    renderLibrary();

    const teasers = await screen.findByRole('region', { name: 'Teasers' });
    const parts = within(teasers).getByRole('group', { name: 'Teaser parts' });

    expect(parts).toHaveAccessibleDescription('Only work inside a teaser.');
    expect(
      await within(parts).findByRole('button', { name: 'Teaser title' })
    ).toBeVisible();
  });

  it('collapses a category', async () => {
    renderLibrary();

    const toggle = await screen.findByRole('button', { name: /^Media/ });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Image' })).toBeNull();
  });

  it('filters the blocks across categories', async () => {
    renderLibrary();

    fireEvent.change(await screen.findByRole('searchbox'), {
      target: { value: 'tit' },
    });

    expect(await tile('Title')).toBeVisible();
    expect(await tile('Teaser title')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Image' })).toBeNull();
    expect(screen.getByText('2 blocks')).toHaveAttribute('role', 'status');
  });

  it('shows an empty state that clears the search', async () => {
    renderLibrary();

    const search = await screen.findByRole('searchbox');

    fireEvent.change(search, { target: { value: 'zzz' } });

    expect(screen.getByText('No blocks match “zzz”.')).toBeVisible();

    fireEvent.click(screen.getAllByRole('button', { name: 'Clear search' })[1]);

    expect(search).toHaveValue('');
    expect(await tile('Image')).toBeVisible();
  });

  it('clears the search with Escape', async () => {
    renderLibrary();

    const search = await screen.findByRole('searchbox');

    fireEvent.change(search, { target: { value: 'image' } });
    fireEvent.keyDown(search, { key: 'Escape' });

    expect(search).toHaveValue('');
  });

  it('adds a clicked block at the end of the document', async () => {
    renderLibrary();

    expect(await screen.findByText(/add it at the end/)).toBeVisible();

    fireEvent.click(await tile('Image'));

    expect(screen.getByTestId('content')).toHaveTextContent('Image');
  });

  it('adds a block with the keyboard', async () => {
    renderLibrary();

    const image = await screen.findByRole('button', { name: 'Image' });

    expect(image).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(image, { key: 'Enter' });
    fireEvent.keyDown(await tile('Title'), { key: ' ' });

    expect(screen.getByTestId('content')).toHaveTextContent('Image,Title');
  });

  it('selects the added block so the next one goes below it', async () => {
    renderLibrary();

    fireEvent.click(await tile('Title'));

    expect(await screen.findByText(/add it below “Title”/)).toBeVisible();

    fireEvent.click(await tile('Image'));

    expect(screen.getByTestId('content')).toHaveTextContent('Title,Image');
  });

  it('adds a block below a selected block without slots', async () => {
    renderLibrary(
      { itemSelector: { index: 0, zone: 'root:default-zone' } },
      {
        root: { props: {} },
        content: [
          { type: 'Title', props: { id: 'title-1' } },
          { type: 'RichText', props: { id: 'text-1' } },
        ],
      }
    );

    expect(await screen.findByText(/add it below “Title”/)).toBeVisible();

    fireEvent.click(await tile('Image'));

    expect(screen.getByTestId('content')).toHaveTextContent(
      'Title,Image,RichText'
    );
  });
});
