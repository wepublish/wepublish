import type { DragEndEvent } from '@dnd-kit/core';
import { MockedProvider } from '@apollo/client/testing/react';
import type { ComponentData } from '@puckeditor/core';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ImageDocument } from '@wepublish/editor/api';
import type {
  ImageMultiSelectPanelProps,
  ImageUpload,
  UseImageUploadQueueOptions,
} from '@wepublish/ui/editor';
import i18next from 'i18next';
import { ComponentProps, useState } from 'react';
import { initReactI18next } from 'react-i18next';

import { ImageMultiPicker } from './image.component';
import { ImageListTarget } from './image.field';

const dnd = vi.hoisted(() => ({
  onDragEnd: undefined as undefined | ((event: DragEndEvent) => void),
}));

const queue = vi.hoisted(() => ({
  options: undefined as undefined | UseImageUploadQueueOptions,
  uploads: [] as ImageUpload[],
  enqueue: vi.fn(),
  retry: vi.fn(),
  remove: vi.fn(),
  clearFinished: vi.fn(),
}));

const puck = vi.hoisted(() => ({
  selectedId: undefined as string | undefined,
  items: [] as ComponentData[],
  dispatch: vi.fn(),
}));

vi.mock('@puckeditor/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@puckeditor/core')>();
  const byId = (id: string) => puck.items.find(item => item.props.id === id);

  return {
    ...actual,
    useGetPuck: () => () => ({
      selectedItem: (puck.selectedId && byId(puck.selectedId)) || null,
      getItemById: byId,
      getSelectorForId: (id: string) => {
        const index = puck.items.findIndex(item => item.props.id === id);

        return index < 0 ? undefined : { index, zone: 'root:default-zone' };
      },
      dispatch: puck.dispatch,
    }),
  };
});

vi.mock('@dnd-kit/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();

  return {
    ...actual,
    DndContext: (props: ComponentProps<typeof actual.DndContext>) => {
      dnd.onDragEnd = props.onDragEnd;

      return <actual.DndContext {...props} />;
    },
  };
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useImageUploadQueue: (options: UseImageUploadQueueOptions) => {
    queue.options = options;
    const [uploads, setUploads] = useState(queue.uploads);

    return {
      ...queue,
      uploads,
      remove: (key: string) => {
        queue.remove(key);
        setUploads(current => current.filter(upload => upload.key !== key));
      },
    };
  },
  ImageMultiSelectPanel: ({
    selectedIds = [],
    onConfirm,
  }: ImageMultiSelectPanelProps) => (
    <button
      type="button"
      onClick={() => onConfirm([...selectedIds, 'river'])}
    >
      Confirm library picks
    </button>
  ),
  ImageEditPanel: ({ id }: { id?: string }) => <p>Editing {id}</p>,
}));

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
  squareURL: `https://cdn.test/${id}-s.jpg`,
  previewURL: null,
  column1URL: null,
  column6URL: null,
});

const imageById = (found: ReturnType<typeof image>) => ({
  request: { query: ImageDocument, variables: { id: found.id } },
  result: { data: { image: found } },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

type PickerOptions = {
  value?: string[];
  readOnly?: boolean;
  max?: number;
  uploadTarget?: ImageListTarget;
};

const StatefulPicker = ({
  value: initial = [],
  onChange,
  ...props
}: PickerOptions & { onChange: (value: string[]) => void }) => {
  const [value, setValue] = useState(initial);

  return (
    <ImageMultiPicker
      {...props}
      value={value}
      onChange={next => {
        onChange(next);
        setValue(next);
      }}
    />
  );
};

const renderPicker = (
  {
    value = ['sunset', 'forest'],
    readOnly,
    max,
    uploadTarget,
  }: PickerOptions = {},
  stateful = false
) => {
  const onChange = vi.fn();
  const props = { value, readOnly, max, uploadTarget, onChange };

  render(
    <MockedProvider
      mocks={[
        imageById(image('sunset', 'Sunset')),
        imageById(image('forest', 'Forest')),
        imageById(image('river', 'River')),
      ]}
      mockLinkDefaultOptions={{ delay: 0 }}
      showWarnings={false}
    >
      {stateful ?
        <StatefulPicker {...props} />
      : <ImageMultiPicker {...props} />}
    </MockedProvider>
  );

  return onChange;
};

const gallery = (id: string, images: string[]): ComponentData => ({
  type: 'Gallery',
  props: { id, images },
});

const galleryImages: ImageListTarget = {
  read: props => props['images'],
  write: (props, ids) => ({ ...props, images: ids }),
};

const failedUpload = (key: string, name: string): ImageUpload => ({
  key,
  file: photo(name),
  status: 'failed',
  canRetry: true,
  errorMessage: 'Network down',
});

const announcement = (text: string) =>
  screen.getByText(text, { selector: '[role="status"]' });

const opacityOf = (element: HTMLElement | null) =>
  element ? getComputedStyle(element).opacity : undefined;

const touchPoints = (count: number) =>
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    configurable: true,
    get: () => count,
  });

const photo = (name: string) => new File([name], name, { type: 'image/jpeg' });

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  queue.options = undefined;
  queue.uploads = [];
  queue.enqueue.mockReset();
  queue.retry.mockReset();
  queue.remove.mockReset();
  puck.selectedId = undefined;
  puck.items = [];
  puck.dispatch.mockReset();
  dnd.onDragEnd = undefined;
  touchPoints(0);
});

describe('ImageMultiPicker', () => {
  it('shows the chosen images in their order', async () => {
    renderPicker();

    await waitFor(() =>
      expect(
        screen
          .getAllByRole('button', { name: /^Remove / })
          .map(button => button.getAttribute('aria-label'))
      ).toEqual(['Remove Sunset', 'Remove Forest'])
    );
  });

  it('removes an image', async () => {
    const onChange = renderPicker();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Forest' })
    );

    expect(onChange).toHaveBeenCalledWith(['sunset']);
  });

  it('reorders the images by dragging', () => {
    const onChange = renderPicker();

    act(() =>
      dnd.onDragEnd?.({
        active: { id: 'forest' },
        over: { id: 'sunset' },
      } as DragEndEvent)
    );

    expect(onChange).toHaveBeenCalledWith(['forest', 'sunset']);
  });

  it('adds images from the library', async () => {
    const onChange = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Add images' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm library picks' })
    );

    expect(onChange).toHaveBeenCalledWith(['sunset', 'forest', 'river']);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Confirm library picks' })
      ).not.toBeInTheDocument()
    );
  });

  it('edits an image in a drawer', async () => {
    renderPicker();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Sunset' }));

    expect(await screen.findByText('Editing sunset')).toBeInTheDocument();
  });

  it('uploads dropped images and appends each one once it finished', () => {
    const onChange = renderPicker();
    const files = [photo('beach.jpg'), photo('dunes.jpg')];

    fireEvent.drop(screen.getByRole('group', { name: 'Images' }), {
      dataTransfer: { files, types: ['Files'] },
    });

    expect(queue.enqueue).toHaveBeenCalledWith(files, undefined);

    act(() => {
      queue.options?.onUploaded?.(image('beach', 'Beach'), 'upload-1');
      queue.options?.onUploaded?.(image('dunes', 'Dunes'), 'upload-2');
    });

    expect(onChange).toHaveBeenNthCalledWith(1, ['sunset', 'forest', 'beach']);
    expect(onChange).toHaveBeenNthCalledWith(2, [
      'sunset',
      'forest',
      'beach',
      'dunes',
    ]);
    expect(queue.remove).toHaveBeenCalledWith('upload-1');
    expect(queue.remove).toHaveBeenCalledWith('upload-2');
  });

  it('uploads the files picked in the file chooser', () => {
    renderPicker();
    const files = [photo('beach.jpg')];

    fireEvent.change(screen.getByLabelText('Upload images'), {
      target: { files },
    });

    expect(queue.enqueue).toHaveBeenCalledWith(files, undefined);
  });

  it('shows running uploads and retries or dismisses a failed one', () => {
    queue.uploads = [
      {
        key: 'upload-1',
        file: photo('beach.jpg'),
        status: 'uploading',
        canRetry: true,
      },
      {
        key: 'upload-2',
        file: photo('dunes.jpg'),
        status: 'failed',
        canRetry: true,
        errorMessage: 'Network down',
      },
    ];
    renderPicker();

    expect(screen.getByText('beach.jpg: Uploading…')).toBeInTheDocument();
    expect(screen.getByText('dunes.jpg: Network down')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry dunes.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss dunes.jpg' }));

    expect(queue.retry).toHaveBeenCalledWith('upload-2');
    expect(queue.remove).toHaveBeenCalledWith('upload-2');
  });

  it('stops adding at the maximum', () => {
    renderPicker({ max: 2 });

    expect(screen.getByRole('button', { name: 'Add images' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('only uploads as many files as still fit', () => {
    renderPicker({ max: 3 });

    fireEvent.drop(screen.getByRole('group', { name: 'Images' }), {
      dataTransfer: {
        files: [photo('beach.jpg'), photo('dunes.jpg')],
        types: ['Files'],
      },
    });

    expect(queue.enqueue).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'beach.jpg' })],
      undefined
    );
  });

  it('attaches uploads that finish after the picker closed to the block that started them', () => {
    puck.items = [
      gallery('gallery-a', ['sunset', 'forest']),
      gallery('gallery-b', ['river']),
    ];
    puck.selectedId = 'gallery-a';
    const onChange = renderPicker({ uploadTarget: galleryImages });

    fireEvent.drop(screen.getByRole('group', { name: 'Images' }), {
      dataTransfer: { files: [photo('beach.jpg')], types: ['Files'] },
    });

    const [, uploadedAfterUnmount] = queue.enqueue.mock.calls[0];
    puck.selectedId = 'gallery-b';
    cleanup();
    uploadedAfterUnmount(image('beach', 'Beach'));

    expect(puck.dispatch).toHaveBeenCalledWith({
      type: 'replace',
      destinationIndex: 0,
      destinationZone: 'root:default-zone',
      data: gallery('gallery-a', ['sunset', 'forest', 'beach']),
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('writes nothing after the picker closed when the block was deleted', () => {
    puck.items = [gallery('gallery-a', ['sunset', 'forest'])];
    puck.selectedId = 'gallery-a';
    renderPicker({ uploadTarget: galleryImages });

    fireEvent.drop(screen.getByRole('group', { name: 'Images' }), {
      dataTransfer: { files: [photo('beach.jpg')], types: ['Files'] },
    });

    const [, uploadedAfterUnmount] = queue.enqueue.mock.calls[0];
    puck.items = [];
    cleanup();
    uploadedAfterUnmount(image('beach', 'Beach'));

    expect(puck.dispatch).not.toHaveBeenCalled();
  });

  it('moves focus to the next image after removing one', async () => {
    renderPicker({ value: ['sunset', 'forest', 'river'] }, true);

    const remove = await screen.findByRole('button', { name: 'Remove Forest' });
    remove.focus();
    fireEvent.click(remove);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove River' })).toHaveFocus()
    );
  });

  it('moves focus to the previous image after removing the last one', async () => {
    renderPicker({ value: ['sunset', 'forest'] }, true);

    const remove = await screen.findByRole('button', { name: 'Remove Forest' });
    remove.focus();
    fireEvent.click(remove);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Remove Sunset' })
      ).toHaveFocus()
    );
  });

  it('moves focus to adding images once every image is removed', async () => {
    renderPicker({ value: ['sunset'] }, true);

    const remove = await screen.findByRole('button', { name: 'Remove Sunset' });
    remove.focus();
    fireEvent.click(remove);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add images' })).toHaveFocus()
    );
  });

  it('keeps focus on the upload when retrying it', () => {
    queue.uploads = [failedUpload('upload-1', 'dunes.jpg')];
    renderPicker();

    const retry = screen.getByRole('button', { name: 'Retry dunes.jpg' });
    retry.focus();
    fireEvent.click(retry);

    expect(screen.getByTitle('dunes.jpg: Network down')).toHaveFocus();
  });

  it('moves focus to the next upload after dismissing one', async () => {
    queue.uploads = [
      failedUpload('upload-1', 'beach.jpg'),
      failedUpload('upload-2', 'dunes.jpg'),
    ];
    renderPicker();

    const dismiss = screen.getByRole('button', { name: 'Dismiss beach.jpg' });
    dismiss.focus();
    fireEvent.click(dismiss);

    await waitFor(() =>
      expect(screen.getByTitle('dunes.jpg: Network down')).toHaveFocus()
    );
  });

  it('moves focus to uploading once every failed upload is dismissed', async () => {
    queue.uploads = [failedUpload('upload-1', 'beach.jpg')];
    renderPicker();

    const dismiss = screen.getByRole('button', { name: 'Dismiss beach.jpg' });
    dismiss.focus();
    fireEvent.click(dismiss);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Upload' })).toHaveFocus()
    );
  });

  it('announces upload progress and the result', () => {
    queue.uploads = [
      {
        key: 'upload-1',
        file: photo('beach.jpg'),
        status: 'uploading',
        canRetry: true,
      },
      failedUpload('upload-2', 'dunes.jpg'),
    ];
    renderPicker();

    const status = announcement('Uploading images: 1 of 2 finished.');

    act(() => queue.options?.onUploaded?.(image('beach', 'Beach'), 'upload-1'));

    expect(status).toHaveTextContent(
      'Images uploaded: 1. Uploads failed: 1. dunes.jpg: Network down'
    );
  });

  it('announces why an upload failed', () => {
    queue.uploads = [failedUpload('upload-1', 'dunes.jpg')];
    renderPicker();

    expect(
      announcement('Uploads failed: 1. dunes.jpg: Network down')
    ).toBeInTheDocument();
  });

  it('keeps the image controls visible on touch screens', async () => {
    touchPoints(1);
    renderPicker();

    const remove = await screen.findByRole('button', { name: 'Remove Sunset' });

    expect(opacityOf(remove.parentElement)).not.toBe('0');
    expect(
      opacityOf(screen.getByRole('button', { name: 'Move Sunset' }))
    ).not.toBe('0');
  });

  it('reveals the image controls on hover only where the device can hover', async () => {
    renderPicker();

    const remove = await screen.findByRole('button', { name: 'Remove Sunset' });

    expect(opacityOf(remove.parentElement)).toBe('0');
    expect(opacityOf(screen.getByRole('button', { name: 'Move Sunset' }))).toBe(
      '0'
    );
  });

  it('offers no changes when read only', async () => {
    renderPicker({ readOnly: true });

    await waitFor(() =>
      expect(
        screen.getAllByRole('img').map(img => img.getAttribute('alt'))
      ).toEqual(['Sunset', 'Forest'])
    );
    expect(
      screen.queryByRole('button', { name: 'Add images' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Remove / })
    ).not.toBeInTheDocument();
  });
});
