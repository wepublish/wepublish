import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { FileDropInput } from './fileDropInput';

const theme = createTheme({ cssVariables: true });

const renderInput = (props: { multiple?: boolean } = {}) => {
  const onDrop = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <FileDropInput
        text="Drop images"
        onDrop={onDrop}
        {...props}
      />
    </ThemeProvider>
  );

  return onDrop;
};

const photo = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
const scan = new File(['b'], 'b.png', { type: 'image/png' });

describe('FileDropInput', () => {
  it('lets the file chooser pick one file by default', () => {
    renderInput();

    expect(screen.getByLabelText('Drop images')).not.toHaveAttribute(
      'multiple'
    );
  });

  it('lets the file chooser pick several files when multiple', () => {
    renderInput({ multiple: true });

    expect(screen.getByLabelText('Drop images')).toHaveAttribute('multiple');
  });

  it('passes every chosen file on', () => {
    const onDrop = renderInput({ multiple: true });

    fireEvent.change(screen.getByLabelText('Drop images'), {
      target: { files: [photo, scan] },
    });

    expect(onDrop).toHaveBeenCalledWith([photo, scan]);
  });

  it('passes every dropped file on', () => {
    const onDrop = renderInput({ multiple: true });

    fireEvent.drop(screen.getByText('Drop images'), {
      dataTransfer: { files: [photo, scan], clearData: vi.fn() },
    });

    expect(onDrop).toHaveBeenCalledWith([photo, scan]);
  });
});
