import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  ImageDocument,
  ImageListDocument,
  UploadImageDocument,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { readImageMetaData } from '../atoms/imageMetaData';
import { prepareImageForUpload } from '../atoms/prepareImageForUpload';
import { ImageMultiSelectPanel } from './imageMultiSelectPanel';

vi.mock('../atoms/prepareImageForUpload', async importOriginal => ({
  ...(await importOriginal<typeof import('../atoms/prepareImageForUpload')>()),
  prepareImageForUpload: vi.fn(),
}));

vi.mock('../atoms/imageMetaData', () => ({ readImageMetaData: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

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

const sunset = image('sunset', 'Sunset');
const forest = image('forest', 'Forest');
const river = image('river', 'River');
const glacier = image('glacier', 'Glacier');

const imageList = (
  filter: string,
  nodes: ReturnType<typeof image>[],
  hasNextPage = false
) => ({
  request: { query: ImageListDocument, variables: { filter, take: 20 } },
  result: {
    data: {
      images: {
        __typename: 'PaginatedImages' as const,
        totalCount: nodes.length,
        nodes,
        pageInfo: {
          __typename: 'PageInfo' as const,
          startCursor: null,
          endCursor: nodes[nodes.length - 1]?.id ?? null,
          hasNextPage,
          hasPreviousPage: false,
        },
      },
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const imageById = (found: ReturnType<typeof image>) => ({
  request: { query: ImageDocument, variables: { id: found.id } },
  result: { data: { image: found } },
});

const upload = (filename: string, uploaded: ReturnType<typeof image>) => ({
  request: {
    query: UploadImageDocument,
    variables: (variables: Record<string, unknown>) =>
      variables['filename'] === filename,
  },
  result: { data: { uploadImage: uploaded } },
});

type Mocks = ReadonlyArray<
  | ReturnType<typeof imageList>
  | ReturnType<typeof imageById>
  | ReturnType<typeof upload>
>;

const renderPanel = ({
  mocks = [imageList('', [sunset, forest, river])],
  selectedIds,
  max,
}: { mocks?: Mocks; selectedIds?: string[]; max?: number } = {}) => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  render(
    <MockedProvider
      mocks={mocks}
      mockLinkDefaultOptions={{ delay: 0 }}
      showWarnings={false}
    >
      <ThemeProvider theme={theme}>
        <ImageMultiSelectPanel
          selectedIds={selectedIds}
          max={max}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </ThemeProvider>
    </MockedProvider>
  );

  return { onConfirm, onClose };
};

const card = (name: RegExp) => screen.findByRole('button', { name });

const selectionOrder = (button: HTMLElement) =>
  within(button).queryByTestId('image-selection-order')?.textContent;

beforeEach(() => {
  (prepareImageForUpload as unknown as Mock).mockImplementation(
    async (file: File) => file
  );
  (readImageMetaData as unknown as Mock).mockResolvedValue({
    title: '',
    description: '',
    source: '',
    link: '',
    licence: '',
  });
});

describe('ImageMultiSelectPanel', () => {
  it('toggles images and numbers them in the order they were picked', async () => {
    const { onClose } = renderPanel();

    fireEvent.click(await card(/^Forest/));
    fireEvent.click(await card(/^Sunset/));

    expect(await card(/^Forest/)).toHaveAttribute('aria-pressed', 'true');
    expect(selectionOrder(await card(/^Forest/))).toBe('1');
    expect(selectionOrder(await card(/^Sunset/))).toBe('2');
    expect(await card(/^River/)).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(await card(/^Forest/));

    expect(await card(/^Forest/)).toHaveAttribute('aria-pressed', 'false');
    expect(selectionOrder(await card(/^Sunset/))).toBe('1');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('adds the picked images in the order they were picked', async () => {
    const { onConfirm } = renderPanel();

    expect(
      screen.getByRole('button', { name: 'images.panels.addImages:0' })
    ).toBeDisabled();

    fireEvent.click(await card(/^River/));
    fireEvent.click(await card(/^Sunset/));

    expect(screen.getByText('images.panels.selectedCount:2')).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: 'images.panels.addImages:2' })
    );

    expect(onConfirm).toHaveBeenCalledWith(['river', 'sunset']);
  });

  it('stops at the maximum', async () => {
    renderPanel({ max: 1 });

    fireEvent.click(await card(/^Forest/));

    expect(await card(/^Sunset/)).toBeDisabled();
    expect(screen.getByText('images.panels.selectedOfMax:1,1')).toBeVisible();

    fireEvent.click(await card(/^Forest/));

    expect(await card(/^Sunset/)).toBeEnabled();
  });

  it('clears the selection', async () => {
    renderPanel();

    fireEvent.click(await card(/^Forest/));
    fireEvent.click(
      screen.getByRole('button', { name: 'images.panels.clearSelection' })
    );

    expect(await card(/^Forest/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('deselects an image from the tray', async () => {
    renderPanel();

    fireEvent.click(await card(/^Forest/));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'images.panels.deselectImage:Forest',
      })
    );

    expect(await card(/^Forest/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts from the images that are already chosen', async () => {
    const { onConfirm } = renderPanel({
      selectedIds: ['river', 'glacier'],
      mocks: [imageList('', [sunset, forest, river]), imageById(glacier)],
    });

    expect(await card(/^River/)).toHaveAttribute('aria-pressed', 'true');
    expect(
      await screen.findByRole('button', {
        name: 'images.panels.deselectImage:Glacier',
      })
    ).toBeInTheDocument();

    fireEvent.click(await card(/^Sunset/));
    fireEvent.click(screen.getByRole('button', { name: 'images.panels.done' }));

    expect(onConfirm).toHaveBeenCalledWith(['river', 'glacier', 'sunset']);
  });

  it('searches the library', async () => {
    renderPanel({
      mocks: [
        imageList('', [sunset, forest, river]),
        imageList('sun', [sunset]),
      ],
    });

    fireEvent.change(
      await screen.findByRole('textbox', {
        name: 'articleEditor.panels.images',
      }),
      { target: { value: 'sun' } }
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /Forest/ })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Sunset/ })).toBeInTheDocument();
  });

  it('uploads dropped images and picks them', async () => {
    const { onConfirm } = renderPanel({
      mocks: [
        imageList('', [sunset]),
        upload('beach', image('beach', 'Beach')),
        upload('dunes', image('dunes', 'Dunes')),
      ],
    });

    fireEvent.click(await card(/^Sunset/));
    fireEvent.drop(screen.getByText('images.panels.dropImages'), {
      dataTransfer: {
        files: [
          new File(['b'], 'beach.jpg', { type: 'image/jpeg' }),
          new File(['d'], 'dunes.jpg', { type: 'image/jpeg' }),
        ],
        clearData: vi.fn(),
      },
    });

    const uploads = screen.getByRole('list', { name: 'images.panels.uploads' });

    expect(within(uploads).getByText('beach.jpg')).toBeInTheDocument();

    await waitFor(() =>
      expect(
        within(uploads).getAllByText('images.panels.uploaded')
      ).toHaveLength(2)
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'images.panels.addImages:3' })
    );

    expect(onConfirm).toHaveBeenCalledWith(['sunset', 'beach', 'dunes']);
  });
});
