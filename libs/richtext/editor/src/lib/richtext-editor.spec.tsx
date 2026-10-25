import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';
import { RichtextEditor } from './richtext-editor';

const theme = createTheme({ cssVariables: true });

const renderEditor = (props: ComponentProps<typeof RichtextEditor> = {}) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <span id="label">Biography</span>
        <RichtextEditor {...props} />
      </ThemeProvider>
    </MockedProvider>
  );

describe('RichtextEditor', () => {
  it('names the editable area with aria-label', () => {
    renderEditor({ 'aria-label': 'Description' });

    const textbox = screen.getByRole('textbox', { name: 'Description' });
    expect(textbox).toHaveAttribute('aria-multiline', 'true');
  });

  it('names the editable area with aria-labelledby', () => {
    renderEditor({ 'aria-labelledby': 'label' });

    expect(
      screen.getByRole('textbox', { name: 'Biography' })
    ).toBeInTheDocument();
  });

  it('follows a changed label', () => {
    const view = renderEditor({ 'aria-label': 'Description' });

    view.rerender(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <span id="label">Biography</span>
          <RichtextEditor aria-label="Lead" />
        </ThemeProvider>
      </MockedProvider>
    );

    expect(screen.getByRole('textbox', { name: 'Lead' })).toBeInTheDocument();
  });

  it('renders the drag handle as a named, non-submitting button', () => {
    const view = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <form>
            <RichtextEditor />
          </form>
        </ThemeProvider>
      </MockedProvider>
    );

    const handle = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="richtext.dragHandle"]'
    );

    expect(handle).not.toBeNull();
    expect(handle).toHaveAttribute('type', 'button');
    expect(handle).toHaveAttribute('tabindex', '-1');
  });
});
