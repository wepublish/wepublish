import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render } from '@testing-library/react';

import { VideoUploadPanel } from './videoUploadPanel';

const enqueueSnackbar = vi.fn();

vi.mock('../snackbar', () => ({
  enqueueSnackbar: (...args: unknown[]) => enqueueSnackbar(...args),
}));

const theme = createTheme({ cssVariables: true });

const renderPanel = () => {
  const onUpload = vi.fn();

  const { container } = render(
    <ThemeProvider theme={theme}>
      <VideoUploadPanel
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

describe('VideoUploadPanel', () => {
  beforeEach(() => enqueueSnackbar.mockClear());

  it.each([
    ['clip.mp4', 'video/mp4'],
    ['clip.webm', 'video/webm'],
    ['clip.ogv', 'video/ogg'],
    ['clip.mov', 'video/quicktime'],
    ['clip.m4v', 'video/x-m4v'],
    ['clip.mpeg', 'video/mpeg'],
  ])('takes %s, which the api accepts', (name, type) => {
    const { onUpload, input } = renderPanel();

    drop(input, fileOf(name, type));

    expect(onUpload).toHaveBeenCalled();
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('refuses a file that is not a video at all', () => {
    const { onUpload, input } = renderPanel();

    drop(input, fileOf('report.pdf', 'application/pdf'));

    expect(onUpload).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ title: 'videos.panels.invalidVideo' })
    );
  });

  it('refuses a video over the size limit', () => {
    const { onUpload, input } = renderPanel();

    drop(input, fileOf('huge.mp4', 'video/mp4', 501 * 1024 * 1024));

    expect(onUpload).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ title: 'videos.panels.fileTooLarge' })
    );
  });
});
