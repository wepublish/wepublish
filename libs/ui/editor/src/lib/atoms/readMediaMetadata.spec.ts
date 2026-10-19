import { readMediaMetadata } from './readMediaMetadata';

const objectUrl = 'blob:media';

class FakeMedia {
  duration = NaN;
  videoWidth = 0;
  videoHeight = 0;
  preload = '';
  src = '';
  onloadedmetadata: (() => void) | null = null;
  onerror: (() => void) | null = null;

  static next: Partial<FakeMedia> & { fail?: boolean } = {};

  constructor() {
    queueMicrotask(() => {
      const { fail, ...values } = FakeMedia.next;
      Object.assign(this, values);
      (fail ? this.onerror : this.onloadedmetadata)?.();
    });
  }
}

beforeEach(() => {
  FakeMedia.next = {};
  vi.spyOn(document, 'createElement').mockImplementation(
    (() => new FakeMedia()) as never
  );
  URL.createObjectURL = vi.fn(() => objectUrl);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.restoreAllMocks());

const file = (type: string) => new File(['x'], 'clip', { type });

describe('readMediaMetadata', () => {
  it('reads how long a video is and how big its picture is', async () => {
    FakeMedia.next = { duration: 29.5, videoWidth: 1920, videoHeight: 1080 };

    await expect(readMediaMetadata(file('video/mp4'))).resolves.toEqual({
      duration: 29.5,
      width: 1920,
      height: 1080,
    });
  });

  it('reads only the length of an audio file', async () => {
    FakeMedia.next = { duration: 183.2 };

    await expect(readMediaMetadata(file('audio/mpeg'))).resolves.toEqual({
      duration: 183.2,
    });
  });

  it('gives back nothing when the browser cannot decode the file', async () => {
    FakeMedia.next = { fail: true };

    await expect(readMediaMetadata(file('video/mp4'))).resolves.toEqual({});
  });

  it('gives back nothing rather than a nonsense duration for a stream', async () => {
    FakeMedia.next = { duration: Infinity, videoWidth: 640, videoHeight: 480 };

    await expect(readMediaMetadata(file('video/mp4'))).resolves.toEqual({
      width: 640,
      height: 480,
    });
  });

  it('gives up rather than hanging when the browser never answers', async () => {
    vi.useFakeTimers();
    FakeMedia.next = { fail: undefined };
    vi.spyOn(document, 'createElement').mockImplementation((() => ({
      preload: '',
      src: '',
    })) as never);

    const metadata = readMediaMetadata(file('video/mp4'));
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(metadata).resolves.toEqual({});
    vi.useRealTimers();
  });

  it('lets go of the object url either way', async () => {
    FakeMedia.next = { duration: 1 };

    await readMediaMetadata(file('audio/mpeg'));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });
});
