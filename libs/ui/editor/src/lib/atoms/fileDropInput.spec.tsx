import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { FileDropInput } from './fileDropInput';

const theme = createTheme({ cssVariables: true });

const renderInput = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('FileDropInput', () => {
  it('names the file input after the visible drop text', () => {
    renderInput(
      <FileDropInput
        text="Drop file here or click to select"
        onDrop={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Drop file here or click to select');

    expect(input).toHaveAttribute('type', 'file');
    expect(input).not.toHaveAttribute('tabindex', '-1');
  });

  it('describes the file input with a hint rendered elsewhere', () => {
    renderInput(
      <>
        <FileDropInput
          text="Drop file"
          aria-describedby="size-hint"
          onDrop={vi.fn()}
        />
        <span id="size-hint">Maximum file size 10 MB</span>
      </>
    );

    expect(screen.getByLabelText('Drop file')).toHaveAccessibleDescription(
      'Maximum file size 10 MB'
    );
  });

  it('hides the file input visually without shrinking it to nothing', () => {
    renderInput(
      <FileDropInput
        text="Drop file"
        onDrop={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Drop file');

    expect(input).toHaveStyle({ width: '1px', height: '1px' });
  });

  it('takes the input out of the tab order when the content brings its own button', () => {
    const { container } = renderInput(
      <FileDropInput onDrop={vi.fn()}>
        <button type="button">Choose file</button>
      </FileDropInput>
    );

    expect(container.querySelector('input[type="file"]')).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('still opens the file dialog from a button in its content', () => {
    const { container } = renderInput(
      <FileDropInput onDrop={vi.fn()}>
        <button type="button">Choose file</button>
      </FileDropInput>
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const click = vi.spyOn(input, 'click');

    fireEvent.click(screen.getByRole('button', { name: 'Choose file' }));

    expect(click).toHaveBeenCalled();
  });

  it('can be named separately from its content', () => {
    renderInput(
      <FileDropInput
        label="Upload image"
        onDrop={vi.fn()}
      >
        <span>Drop here</span>
      </FileDropInput>
    );

    expect(screen.getByLabelText('Upload image')).not.toHaveAttribute(
      'tabindex',
      '-1'
    );
  });
});
