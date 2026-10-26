import { createTheme, Modal, ThemeProvider } from '@mui/material';
import { act, render, screen, waitFor } from '@testing-library/react';

import { closeSnackbar, enqueueSnackbar, SnackbarHost } from './snackbar';

const theme = createTheme({ cssVariables: true });

const renderHost = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SnackbarHost {...props} />
    </ThemeProvider>
  );

const alertOf = (text: string) =>
  screen.getByText(text).closest('.MuiAlert-root') as HTMLElement;

afterEach(() => {
  act(() => closeSnackbar());
});

describe('enqueueSnackbar', () => {
  it('renders the message in an alert of the requested severity', () => {
    renderHost();

    act(() => {
      enqueueSnackbar('Saved', { variant: 'success' });
    });

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(alertOf('Saved').className).toContain('Success');
  });

  it('defaults to the info variant', () => {
    renderHost();

    act(() => {
      enqueueSnackbar('Heads up');
    });

    expect(alertOf('Heads up').className).toContain('Info');
  });

  it.each(['success', 'info'] as const)(
    'announces %s politely so it does not interrupt typing',
    variant => {
      renderHost();

      act(() => {
        enqueueSnackbar('Draft autosaved', { variant });
      });

      expect(screen.getByRole('status')).toHaveTextContent('Draft autosaved');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );

  it.each(['success', 'info'] as const)(
    'adds a %s to a polite live region that was already mounted',
    variant => {
      renderHost();

      const region = screen.getByRole('status');
      expect(region).toBeEmptyDOMElement();

      act(() => {
        enqueueSnackbar('Draft autosaved', { variant });
      });

      expect(screen.getByRole('status')).toBe(region);
      expect(region).toHaveTextContent('Draft autosaved');
    }
  );

  it('keeps the live region announcing while a modal drawer is open', async () => {
    renderHost();
    const region = screen.getByRole('status');

    render(
      <Modal open>
        <div>Edit author</div>
      </Modal>
    );

    act(() => {
      enqueueSnackbar('Author saved', { variant: 'success' });
    });

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Author saved')
    );
    expect(screen.getByRole('status')).toBe(region);
  });

  it.each(['error', 'warning'] as const)(
    'announces %s assertively',
    variant => {
      renderHost();

      act(() => {
        enqueueSnackbar('Something went wrong', { variant });
      });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong'
      );
    }
  );

  it.each(['error', 'warning'] as const)(
    'gives a %s twice as long to be read by default',
    variant => {
      vi.useFakeTimers();

      try {
        renderHost();

        act(() => {
          enqueueSnackbar('Could not save', { variant });
        });

        act(() => vi.advanceTimersByTime(5001));
        expect(screen.getByText('Could not save')).toBeInTheDocument();

        act(() => vi.advanceTimersByTime(5000));
        expect(screen.queryByText('Could not save')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    }
  );

  it('stays announced while a modal drawer hides the rest of the page', () => {
    render(
      <ThemeProvider theme={theme}>
        <SnackbarHost />
        <Modal open>
          <div>Edit author</div>
        </Modal>
      </ThemeProvider>
    );

    act(() => {
      enqueueSnackbar('Author saved', { variant: 'error' });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Author saved');
  });

  it('keeps the notifications inside a named landmark', () => {
    renderHost({ label: 'Notifications' });

    act(() => {
      enqueueSnackbar('Saved', { variant: 'success' });
    });

    expect(
      screen.getByRole('region', { name: 'Notifications' })
    ).toContainElement(screen.getByRole('status'));
  });

  it('keeps the landmark exposed while a modal drawer hides the page', () => {
    render(
      <ThemeProvider theme={theme}>
        <SnackbarHost label="Notifications" />
        <Modal open>
          <div>Edit author</div>
        </Modal>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('region', { name: 'Notifications' })
    ).not.toHaveAttribute('aria-hidden');
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

    await screen.findByText('Saved');

    expect(alertOf('Saved')).toHaveStyle({ alignItems: 'center' });
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
