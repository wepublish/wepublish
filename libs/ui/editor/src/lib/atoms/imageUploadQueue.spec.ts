import {
  createTaskQueue,
  imageUploadDetails,
  isImageFile,
  updateImageUpload,
} from './imageUploadQueue';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('createTaskQueue', () => {
  it('never runs more tasks at once than allowed', async () => {
    const runs = new Map<string, ReturnType<typeof deferred>>();
    const started: string[] = [];
    const queue = createTaskQueue<string>(2, task => {
      started.push(task);
      const run = deferred();
      runs.set(task, run);

      return run.promise;
    });

    queue.push('a', 'b', 'c', 'd');

    expect(started).toEqual(['a', 'b']);

    runs.get('b')?.resolve();
    await flush();

    expect(started).toEqual(['a', 'b', 'c']);

    runs.get('a')?.resolve();
    await flush();

    expect(started).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps going after a task failed', async () => {
    const started: string[] = [];
    const queue = createTaskQueue<string>(1, async task => {
      started.push(task);

      if (task === 'a') {
        throw new Error('broken');
      }
    });

    queue.push('a', 'b');
    await flush();

    expect(started).toEqual(['a', 'b']);
  });

  it('runs tasks pushed after the queue drained', async () => {
    const started: string[] = [];
    const queue = createTaskQueue<string>(2, async task => {
      started.push(task);
    });

    queue.push('a');
    await flush();
    queue.push('b');

    expect(started).toEqual(['a', 'b']);
  });
});

describe('imageUploadDetails', () => {
  it('fills the upload with the metadata of the file', () => {
    const file = new File(['x'], 'holiday.photo.webp', { type: 'image/webp' });

    expect(
      imageUploadDetails(file, {
        title: 'Beach',
        description: 'Sunset at the beach',
        source: 'Jane Doe',
        link: 'https://example.com',
        licence: 'CC-BY',
      })
    ).toEqual({
      filename: 'holiday.photo',
      title: 'Beach',
      description: 'Sunset at the beach',
      source: 'Jane Doe',
      link: 'https://example.com',
      license: 'CC-BY',
      tags: [],
      focalPointX: 0.5,
      focalPointY: 0.5,
    });
  });

  it('leaves out metadata the file does not carry', () => {
    const file = new File(['x'], 'scan', { type: 'image/png' });

    expect(
      imageUploadDetails(file, {
        title: '',
        description: '',
        source: '',
        link: '',
        licence: '',
      })
    ).toEqual({
      filename: 'scan',
      title: undefined,
      description: undefined,
      source: undefined,
      link: undefined,
      license: undefined,
      tags: [],
      focalPointX: 0.5,
      focalPointY: 0.5,
    });
  });
});

describe('isImageFile', () => {
  it('accepts images only', () => {
    expect(isImageFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe(
      true
    );
    expect(
      isImageFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))
    ).toBe(false);
  });
});

describe('updateImageUpload', () => {
  it('changes only the upload with the given key', () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const uploads = [
      { key: 'one', file, status: 'queued' as const, canRetry: true },
      { key: 'two', file, status: 'queued' as const, canRetry: true },
    ];

    expect(updateImageUpload(uploads, 'two', { status: 'uploading' })).toEqual([
      uploads[0],
      { ...uploads[1], status: 'uploading' },
    ]);
  });
});
