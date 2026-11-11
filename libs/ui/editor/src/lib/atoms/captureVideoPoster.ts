const GIVE_UP_AFTER_MS = 15000;
const SEEK_TO_SECONDS = 1;
const MAX_EDGE = 640;
const QUALITY = 0.8;

const scaleToFit = (width: number, height: number) => {
  const longest = Math.max(width, height);

  if (longest <= MAX_EDGE) {
    return { width, height };
  }

  const factor = MAX_EDGE / longest;

  return {
    width: Math.round(width * factor),
    height: Math.round(height * factor),
  };
};

export function captureVideoPoster(file: File): Promise<Blob | null> {
  const video = document.createElement('video') as HTMLVideoElement;
  const objectUrl = URL.createObjectURL(file);

  return new Promise<Blob | null>(resolve => {
    const giveUp = setTimeout(() => done(null), GIVE_UP_AFTER_MS);

    const done = (poster: Blob | null) => {
      clearTimeout(giveUp);
      URL.revokeObjectURL(objectUrl);
      resolve(poster);
    };

    video.onerror = () => done(null);

    video.onloadedmetadata = () => {
      if (!video.videoWidth || !video.videoHeight) {
        done(null);
        return;
      }

      video.currentTime = Math.min(
        SEEK_TO_SECONDS,
        Math.max(0, (video.duration || 0) / 2)
      );
    };

    video.onseeked = () => {
      const { width, height } = scaleToFit(video.videoWidth, video.videoHeight);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');

      if (!context) {
        done(null);
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      canvas.toBlob(blob => done(blob), 'image/jpeg', QUALITY);
    };

    video.preload = 'metadata';
    video.muted = true;
    video.src = objectUrl;
  });
}
