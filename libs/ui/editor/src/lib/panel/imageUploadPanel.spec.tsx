import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { enqueueSnackbar } from '../snackbar';
import { ImageUploadPanel } from './imageUploadPanel';

vi.mock('../snackbar', () => ({ enqueueSnackbar: vi.fn() }));

const theme = createTheme({ cssVariables: true });

const renderPanel = () => {
  const onUpload = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <ImageUploadPanel
        onClose={vi.fn()}
        onUpload={onUpload}
      />
    </ThemeProvider>
  );

  return onUpload;
};

const drop = (file: File) =>
  fireEvent.drop(screen.getByText('articleEditor.panels.dropImage'), {
    dataTransfer: { files: [file], clearData: vi.fn() },
  });

describe('ImageUploadPanel', () => {
  beforeEach(() => vi.mocked(enqueueSnackbar).mockClear());

  it('hands a dropped image on', () => {
    const onUpload = renderPanel();
    const photo = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    drop(photo);

    expect(onUpload).toHaveBeenCalledWith(photo);
  });

  it('refuses a file that is no image', () => {
    const onUpload = renderPanel();

    drop(new File(['x'], 'notes.pdf', { type: 'application/pdf' }));

    expect(enqueueSnackbar).toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });
});
