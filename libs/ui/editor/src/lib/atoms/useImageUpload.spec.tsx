import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { UploadImageDocument } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import type { Mock } from 'vitest';

import { readImageMetaData } from './imageMetaData';
import { prepareImageForUpload } from './prepareImageForUpload';
import { useImageUploadQueue } from './useImageUpload';

vi.mock('./prepareImageForUpload', async importOriginal => ({
  ...(await importOriginal<typeof import('./prepareImageForUpload')>()),
  prepareImageForUpload: vi.fn(),
}));

vi.mock('./imageMetaData', () => ({ readImageMetaData: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockedPrepare = prepareImageForUpload as unknown as Mock;
const mockedMetaData = readImageMetaData as unknown as Mock;

const image = (id: string) => ({
  __typename: 'Image' as const,
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  title: id,
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

type UploadVariables = Record<string, unknown>;

const uploadMock = (
  filename: string,
  outcome: ReturnType<typeof image> | Error,
  delay = 0
) => ({
  request: {
    query: UploadImageDocument,
    variables: (variables: UploadVariables) =>
      variables['filename'] === filename,
  },
  ...(outcome instanceof Error ?
    { error: outcome }
  : { result: { data: { uploadImage: outcome } } }),
  delay,
});

const photo = (name: string, type = 'image/jpeg') =>
  new File([name], name, { type });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
};

const renderQueue = (
  mocks: ReturnType<typeof uploadMock>[],
  onUploaded = vi.fn()
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider
      mocks={mocks}
      showWarnings={false}
    >
      {children}
    </MockedProvider>
  );

  return renderHook(() => useImageUploadQueue({ onUploaded }), { wrapper });
};

const statuses = (uploads: { status: string }[]) =>
  uploads.map(({ status }) => status);

beforeEach(() => {
  mockedPrepare.mockReset();
  mockedPrepare.mockImplementation(async (file: File) => file);
  mockedMetaData.mockReset();
  mockedMetaData.mockResolvedValue({
    title: '',
    description: '',
    source: '',
    link: '',
    licence: '',
  });
});

describe('useImageUploadQueue', () => {
  it('uploads every image and reports them in the order they finished', async () => {
    const onUploaded = vi.fn();
    const { result } = renderQueue(
      [uploadMock('a', image('i1')), uploadMock('b', image('i2'), 20)],
      onUploaded
    );

    act(() => result.current.enqueue([photo('a.jpg'), photo('b.jpg')]));

    await waitFor(() =>
      expect(statuses(result.current.uploads)).toEqual(['done', 'done'])
    );
    expect(onUploaded.mock.calls.map(([uploaded]) => uploaded.id)).toEqual([
      'i1',
      'i2',
    ]);
    expect(result.current.uploads.map(({ image }) => image?.id)).toEqual([
      'i1',
      'i2',
    ]);
  });

  it('uploads the metadata the file carries', async () => {
    mockedMetaData.mockResolvedValue({
      title: 'Beach',
      description: '',
      source: 'Jane Doe',
      link: '',
      licence: '',
    });
    const variables = vi.fn();
    const { result } = renderQueue([
      {
        ...uploadMock('a', image('i1')),
        request: {
          query: UploadImageDocument,
          variables: (received: UploadVariables) => {
            variables(received);

            return true;
          },
        },
      },
    ]);

    act(() => result.current.enqueue([photo('a.jpg')]));

    await waitFor(() =>
      expect(statuses(result.current.uploads)).toEqual(['done'])
    );
    expect(variables).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'a',
        title: 'Beach',
        source: 'Jane Doe',
      })
    );
  });

  it('uploads two images at a time', async () => {
    const preparing = new Map<string, ReturnType<typeof deferred<File>>>();
    mockedPrepare.mockImplementation((file: File) => {
      const pending = deferred<File>();
      preparing.set(file.name, pending);

      return pending.promise;
    });
    const { result } = renderQueue([
      uploadMock('a', image('i1')),
      uploadMock('b', image('i2')),
      uploadMock('c', image('i3')),
    ]);
    const files = [photo('a.jpg'), photo('b.jpg'), photo('c.jpg')];

    act(() => result.current.enqueue(files));

    expect([...preparing.keys()]).toEqual(['a.jpg', 'b.jpg']);
    expect(statuses(result.current.uploads)).toEqual([
      'uploading',
      'uploading',
      'queued',
    ]);

    await act(async () => preparing.get('a.jpg')?.resolve(files[0]));

    await waitFor(() =>
      expect([...preparing.keys()]).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
    );
  });

  it('hands uploads that finish after unmount to the callback they were queued with', async () => {
    const onUploaded = vi.fn();
    const afterUnmount = vi.fn();
    const { result, unmount } = renderQueue(
      [
        uploadMock('a', image('i1'), 20),
        uploadMock('b', image('i2'), 20),
        uploadMock('c', image('i3'), 20),
      ],
      onUploaded
    );

    act(() =>
      result.current.enqueue(
        [photo('a.jpg'), photo('b.jpg'), photo('c.jpg')],
        afterUnmount
      )
    );
    unmount();

    await waitFor(() =>
      expect(
        afterUnmount.mock.calls.map(([uploaded]) => uploaded.id).sort()
      ).toEqual(['i1', 'i2', 'i3'])
    );
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('reports to the mounted component only, not to the callback the uploads were queued with', async () => {
    const onUploaded = vi.fn();
    const afterUnmount = vi.fn();
    const { result } = renderQueue([uploadMock('a', image('i1'))], onUploaded);

    act(() => result.current.enqueue([photo('a.jpg')], afterUnmount));

    await waitFor(() =>
      expect(onUploaded).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'i1' }),
        result.current.uploads[0].key
      )
    );
    expect(afterUnmount).not.toHaveBeenCalled();
  });

  it('marks a failed upload and uploads it again on retry', async () => {
    const { result } = renderQueue([
      uploadMock('a', new Error('Failed to fetch')),
      uploadMock('a', image('i1')),
    ]);

    act(() => result.current.enqueue([photo('a.jpg')]));

    await waitFor(() =>
      expect(statuses(result.current.uploads)).toEqual(['failed'])
    );
    expect(result.current.uploads[0].canRetry).toBe(true);

    act(() => result.current.retry(result.current.uploads[0].key));

    await waitFor(() =>
      expect(statuses(result.current.uploads)).toEqual(['done'])
    );
    expect(result.current.uploads[0].errorMessage).toBeUndefined();
  });

  it('refuses files that are no images without uploading them', () => {
    const { result } = renderQueue([]);

    act(() => result.current.enqueue([photo('notes.pdf', 'application/pdf')]));

    expect(result.current.uploads).toEqual([
      expect.objectContaining({
        status: 'failed',
        canRetry: false,
        errorMessage: 'articleEditor.panels.invalidImage',
      }),
    ]);
    expect(mockedPrepare).not.toHaveBeenCalled();
  });

  it('refuses images the browser could not convert into a supported format', async () => {
    mockedPrepare.mockImplementation(async (file: File) => file);
    const { result } = renderQueue([]);

    act(() => result.current.enqueue([photo('scan.heic', 'image/heic')]));

    await waitFor(() =>
      expect(result.current.uploads).toEqual([
        expect.objectContaining({
          status: 'failed',
          canRetry: false,
          errorMessage: 'images.panels.unsupportedImage',
        }),
      ])
    );
  });

  it('forgets finished uploads when cleared or removed', async () => {
    const { result } = renderQueue([
      uploadMock('a', image('i1')),
      uploadMock('b', new Error('Failed to fetch')),
      uploadMock('c', image('i3')),
    ]);

    act(() => result.current.enqueue([photo('a.jpg'), photo('b.jpg')]));

    await waitFor(() =>
      expect(statuses(result.current.uploads)).toEqual(['done', 'failed'])
    );

    act(() => result.current.remove(result.current.uploads[1].key));

    expect(statuses(result.current.uploads)).toEqual(['done']);

    act(() => result.current.enqueue([photo('c.jpg')]));
    act(() => result.current.clearFinished());

    expect(statuses(result.current.uploads)).toEqual(['uploading']);

    await waitFor(() =>
      expect(statuses(result.current.uploads)).toEqual(['done'])
    );
  });
});
