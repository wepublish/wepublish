import { createTheme, ThemeProvider } from '@mui/material';
import { act, render, screen } from '@testing-library/react';

import { closeSnackbar, enqueueSnackbar, SnackbarHost } from './snackbar';

const theme = createTheme({ cssVariables: true });

const renderHost = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SnackbarHost {...props} />
    </ThemeProvider>
  );

afterEach(() => {
  act(() => closeSnackbar());
});

describe('enqueueSnackbar', () => {
  it('renders the message in an alert of the requested severity', () => {
    renderHost();

    act(() => {
      enqueueSnackbar('Saved', { variant: 'success' });
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Saved');
    expect(alert.className).toContain('Success');
  });

  it('defaults to the info variant', () => {
    renderHost();

    act(() => {
      enqueueSnackbar('Heads up');
    });

    expect(screen.getByRole('alert').className).toContain('Info');
  });

  it('runs the action and closes the snackbar when its button is pressed', () => {
    renderHost();
    const onClick = vi.fn();

    act(() => {
      enqueueSnackbar('md removed', { action: { label: 'Undo', onClick } });
    });

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: 'Undo' }).click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('md removed')).not.toBeInTheDocument();
  });

  it('renders a title above the message when given', () => {
    renderHost();

    act(() => {
      enqueueSnackbar('Body', { variant: 'warning', title: 'Careful' });
    });

    expect(screen.getByText('Careful')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('closes a single snackbar by its key', () => {
    renderHost();

    let key = '';
    act(() => {
      key = enqueueSnackbar('Transient');
    });
    expect(screen.getByText('Transient')).toBeInTheDocument();

    act(() => closeSnackbar(key));
    expect(screen.queryByText('Transient')).not.toBeInTheDocument();
  });

  it('closes every snackbar when no key is given', () => {
    renderHost();

    act(() => {
      enqueueSnackbar('One');
      enqueueSnackbar('Two');
    });
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();

    act(() => closeSnackbar());
    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(screen.queryByText('Two')).not.toBeInTheDocument();
  });

  it('auto hides after autoHideDuration', () => {
    vi.useFakeTimers();

    try {
      renderHost();

      act(() => {
        enqueueSnackbar('Bye', { autoHideDuration: 3000 });
      });
      expect(screen.getByText('Bye')).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(3001));
      expect(screen.queryByText('Bye')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a snackbar with a null autoHideDuration until it is closed', () => {
    vi.useFakeTimers();

    try {
      renderHost();

      act(() => {
        enqueueSnackbar('Sticky', {
          variant: 'error',
          autoHideDuration: null,
        });
      });

      act(() => vi.advanceTimersByTime(60_000));
      expect(screen.getByText('Sticky')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops the oldest snackbar once maxSnack is exceeded', () => {
    renderHost({ maxSnack: 2 });

    act(() => {
      enqueueSnackbar('First');
      enqueueSnackbar('Second');
      enqueueSnackbar('Third');
    });

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it.each([
    ['without a title', undefined],
    ['with a title', 'Done'],
  ])('centres the icon against the message %s', async (_name, title) => {
    render(<SnackbarHost />);
    enqueueSnackbar('Saved', { variant: 'success', title });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveStyle({ alignItems: 'center' });
  });

  it('drops the title margin when the title is the only text', async () => {
    render(<SnackbarHost />);
    enqueueSnackbar('', { variant: 'success', title: 'Draft saved' });

    const title = await screen.findByText('Draft saved');

    expect(title).toHaveStyle({ marginBottom: '0px' });
  });

  it('keeps it when a message follows', async () => {
    render(<SnackbarHost />);
    enqueueSnackbar('and here is why', {
      variant: 'success',
      title: 'Draft saved',
    });

    const title = await screen.findByText('Draft saved');

    expect(title).not.toHaveStyle({ marginBottom: '0px' });
  });
});
