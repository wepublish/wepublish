import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImageListDocument } from '@wepublish/editor/api';

import { ImageSelectPanel } from './imageSelectPanel';

const theme = createTheme({ cssVariables: true });

const image = (id: string, title: string) => ({
  __typename: 'Image' as const,
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  title,
  filename: id,
  extension: '.jpg',
  width: 100,
  height: 100,
  fileSize: 1,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPointX: 0.5,
  focalPointY: 0.5,
  url: `https://cdn.test/${id}.jpg`,
  largeURL: null,
  mediumURL: `https://cdn.test/${id}-m.jpg`,
  thumbURL: `https://cdn.test/${id}-t.jpg`,
  squareURL: null,
  previewURL: null,
  column1URL: null,
  column6URL: null,
});

const page = (
  nodes: ReturnType<typeof image>[],
  endCursor: string,
  hasNextPage: boolean
) => ({
  data: {
    images: {
      __typename: 'PaginatedImages' as const,
      totalCount: 3,
      nodes,
      pageInfo: {
        __typename: 'PageInfo' as const,
        startCursor: nodes[0]?.id ?? null,
        endCursor,
        hasNextPage,
        hasPreviousPage: false,
      },
    },
  },
});

const sunset = image('sunset', 'Sunset');
const forest = image('forest', 'Forest');
const river = image('river', 'River');

const mocks = [
  {
    request: {
      query: ImageListDocument,
      variables: { filter: '', take: 20 },
    },
    result: page([sunset, forest], 'forest', true),
  },
  {
    request: {
      query: ImageListDocument,
      variables: { filter: '', take: 20, skip: 1, cursorId: 'forest' },
    },
    result: page([river], 'river', false),
  },
];

const renderPanel = () => {
  const onSelect = vi.fn();

  render(
    <MockedProvider
      mocks={mocks}
      mockLinkDefaultOptions={{ delay: 0 }}
    >
      <ThemeProvider theme={theme}>
        <ImageSelectPanel
          onClose={vi.fn()}
          onSelect={onSelect}
        />
      </ThemeProvider>
    </MockedProvider>
  );

  return onSelect;
};

describe('ImageSelectPanel', () => {
  it('picks an image by clicking its card', async () => {
    const onSelect = renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: /Forest/ }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'forest' })
    );
  });

  it('loads the next page after the last image', async () => {
    renderPanel();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'articleEditor.panels.loadMore',
      })
    );

    expect(
      await screen.findByRole('button', { name: /River/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sunset/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'articleEditor.panels.loadMore' })
    ).not.toBeInTheDocument();
  });
});
