import { IFile } from '@nestjs/common/pipes/file/interfaces';

import {
  getExtensionForVideoMimeType,
  getMimeTypeForVideoExtension,
  supportedVideoMimeTypes,
  SupportedVideosValidator,
} from './supported-videos-validator';

const file = (mimetype: string) => ({ mimetype }) as IFile;

describe('SupportedVideosValidator', () => {
  const validator = new SupportedVideosValidator();

  it.each(['video/mp4', 'video/webm', 'video/quicktime'])(
    'accepts %s',
    async mimetype => {
      await expect(validator.isValid(file(mimetype))).resolves.toBe(true);
    }
  );

  it.each(['application/pdf', 'image/png', 'text/plain'])(
    'rejects %s',
    async mimetype => {
      await expect(validator.isValid(file(mimetype))).resolves.toBe(false);
    }
  );

  it('rejects a missing file rather than throwing', async () => {
    await expect(validator.isValid(undefined)).resolves.toBe(false);
  });

  it('names the supported formats when it refuses', () => {
    expect(validator.buildErrorMessage(file('image/png'))).toContain('MP4');
  });
});

describe('video mime type mapping', () => {
  it('maps every supported mime type to an extension', () => {
    for (const mimeType of supportedVideoMimeTypes) {
      expect(getExtensionForVideoMimeType(mimeType)).not.toBe('');
    }
  });

  it('round-trips an extension back to its mime type', () => {
    expect(getMimeTypeForVideoExtension('.mp4')).toBe('video/mp4');
    expect(getMimeTypeForVideoExtension('.MOV')).toBe('video/quicktime');
  });

  it('returns an empty extension for an unknown mime type', () => {
    expect(getExtensionForVideoMimeType('application/pdf')).toBe('');
  });
});
