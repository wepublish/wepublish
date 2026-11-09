import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render } from '@testing-library/react';

import { AudioUploadPanel } from './audioUploadPanel';

const enqueueSnackbar = vi.fn();

vi.mock('../snackbar', () => ({
  enqueueSnackbar: (...args: unknown[]) => enqueueSnackbar(...args),
}));

const theme = createTheme({ cssVariables: true });

const renderPanel = () => {
  const onUpload = vi.fn();

  const { container } = render(
    <ThemeProvider theme={theme}>
      <AudioUploadPanel
        onClose={vi.fn()}
        onUpload={onUpload}
      />
    </ThemeProvider>
  );

  const input = container.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;

  return { onUpload, input };
};

const fileOf = (name: string, type: string, size = 1024) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });

  return file;
};

const drop = (input: HTMLInputElement, file: File) =>
  fireEvent.change(input, { target: { files: [file] } });

describe('AudioUploadPanel', () => {
  beforeEach(() => enqueueSnackbar.mockClear());

  it.each([
    ['track.mp3', 'audio/mpeg'],
    ['track.ogg', 'audio/ogg'],
    ['track.wav', 'audio/wav'],
    ['track.weba', 'audio/webm'],
    ['track.aac', 'audio/aac'],
    ['track.m4a', 'audio/mp4'],
    ['track.flac', 'audio/flac'],
  ])('takes %s, which the api accepts', (name, type) => {
    const { onUpload, input } = renderPanel();

    drop(input, fileOf(name, type));

    expect(onUpload).toHaveBeenCalled();
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('refuses a video, which belongs in the video library', () => {
    const { onUpload, input } = renderPanel();

    drop(input, fileOf('clip.mp4', 'video/mp4'));

    expect(onUpload).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ title: 'audio.panels.invalidAudio' })
    );
  });

  it('refuses an audio file over the size limit', () => {
    const { onUpload, input } = renderPanel();

    drop(input, fileOf('huge.mp3', 'audio/mpeg', 201 * 1024 * 1024));

    expect(onUpload).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ title: 'audio.panels.fileTooLarge' })
    );
  });
});
