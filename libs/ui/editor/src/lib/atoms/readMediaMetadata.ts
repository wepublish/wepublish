export interface MediaMetadata {
  duration?: number;
  width?: number;
  height?: number;
}

const GIVE_UP_AFTER_MS = 5000;

export function readMediaMetadata(file: File): Promise<MediaMetadata> {
  const isVideo = file.type.startsWith('video/');
  const element = document.createElement(
    isVideo ? 'video' : 'audio'
  ) as HTMLVideoElement;

  const objectUrl = URL.createObjectURL(file);

  return new Promise<MediaMetadata>(resolve => {
    const giveUp = setTimeout(() => done({}), GIVE_UP_AFTER_MS);

    const done = (metadata: MediaMetadata) => {
      clearTimeout(giveUp);
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    };

    element.onloadedmetadata = () => {
      const metadata: MediaMetadata = {};

      if (Number.isFinite(element.duration)) {
        metadata.duration = element.duration;
      }

      if (element.videoWidth && element.videoHeight) {
        metadata.width = element.videoWidth;
        metadata.height = element.videoHeight;
      }

      done(metadata);
    };

    element.onerror = () => done({});

    element.preload = 'metadata';
    element.src = objectUrl;
  });
}
