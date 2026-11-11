import { IFile } from '@nestjs/common/pipes/file/interfaces';

import {
  getExtensionForAudioMimeType,
  getMimeTypeForAudioExtension,
  supportedAudioMimeTypes,
  SupportedAudiosValidator,
} from './supported-audios-validator';

const file = (mimetype: string) => ({ mimetype }) as IFile;

describe('SupportedAudiosValidator', () => {
  const validator = new SupportedAudiosValidator();

  it.each(['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac'])(
    'accepts %s',
    async mimetype => {
      await expect(validator.isValid(file(mimetype))).resolves.toBe(true);
    }
  );

  it.each(['video/mp4', 'application/pdf', 'image/png'])(
    'rejects %s',
    async mimetype => {
      await expect(validator.isValid(file(mimetype))).resolves.toBe(false);
    }
  );

  it('rejects a missing file rather than throwing', async () => {
    await expect(validator.isValid(undefined)).resolves.toBe(false);
  });

  it('names the supported formats when it refuses', () => {
    expect(validator.buildErrorMessage(file('image/png'))).toContain('MP3');
  });
});

describe('audio mime type mapping', () => {
  it('maps every supported mime type to an extension', () => {
    for (const mimeType of supportedAudioMimeTypes) {
      expect(getExtensionForAudioMimeType(mimeType)).not.toBe('');
    }
  });

  it('round-trips an extension back to its mime type', () => {
    expect(getMimeTypeForAudioExtension('.mp3')).toBe('audio/mpeg');
    expect(getMimeTypeForAudioExtension('.WAV')).toBe('audio/wav');
  });

  it('reads m4a as aac, which is what browsers send', () => {
    expect(getMimeTypeForAudioExtension('.m4a')).toBe('audio/mp4');
  });

  it('returns an empty extension for an unknown mime type', () => {
    expect(getExtensionForAudioMimeType('video/mp4')).toBe('');
  });
});
