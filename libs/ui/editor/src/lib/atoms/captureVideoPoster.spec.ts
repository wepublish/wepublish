import { captureVideoPoster } from './captureVideoPoster';

const objectUrl = 'blob:video';

class FakeVideo {
  duration = 30;
  videoWidth = 1920;
  videoHeight = 1080;
  currentTime = 0;
  preload = '';
  muted = false;
  src = '';
  onloadedmetadata: (() => void) | null = null;
  onseeked: (() => void) | null = null;
  onerror: (() => void) | null = null;

  static next: { fail?: boolean; noPicture?: boolean; duration?: number } = {};

  constructor() {
    queueMicrotask(() => {
      if (FakeVideo.next.fail) {
        this.onerror?.();
        return;
      }

      if (FakeVideo.next.noPicture) {
        this.videoWidth = 0;
        this.videoHeight = 0;
      }

      if (FakeVideo.next.duration !== undefined) {
        this.duration = FakeVideo.next.duration;
      }

      this.onloadedmetadata?.();
      queueMicrotask(() => this.onseeked?.());
    });
  }
}

const drawImage = vi.fn();
const toBlob = vi.fn((cb: (blob: Blob | null) => void) =>
  cb(new Blob(['jpeg'], { type: 'image/jpeg' }))
);

beforeEach(() => {
  FakeVideo.next = {};
  drawImage.mockClear();
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
    tag === 'canvas' ?
      { width: 0, height: 0, getContext: () => ({ drawImage }), toBlob }
    : new FakeVideo()) as never);
  URL.createObjectURL = vi.fn(() => objectUrl);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.restoreAllMocks());

const file = () => new File(['x'], 'clip.mp4', { type: 'video/mp4' });

describe('captureVideoPoster', () => {
  it('draws a frame from the video and hands back a jpeg', async () => {
    const poster = await captureVideoPoster(file());

    expect(poster?.type).toBe('image/jpeg');
    expect(drawImage).toHaveBeenCalled();
  });

  it('seeks past the very first frame, which is often black', async () => {
    let seekedTo = -1;
    const original = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toBlob,
        } as never;
      }

      const video = new FakeVideo();
      Object.defineProperty(video, 'currentTime', {
        set(value: number) {
          seekedTo = value;
        },
        get: () => seekedTo,
      });

      return video as never;
    }) as never);

    await captureVideoPoster(file());

    expect(seekedTo).toBeGreaterThan(0);
    expect(original).toBeTruthy();
  });

  it('gives back nothing when the browser cannot decode the video', async () => {
    FakeVideo.next = { fail: true };

    await expect(captureVideoPoster(file())).resolves.toBeNull();
  });

  it('gives back nothing for a file that carries no picture', async () => {
    FakeVideo.next = { noPicture: true };

    await expect(captureVideoPoster(file())).resolves.toBeNull();
  });

  it('lets go of the object url', async () => {
    await captureVideoPoster(file());

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });
});
