import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { SingleViewTitle } from './singleViewTitle';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({
  cssVariables: true,
  typography: { h1: { fontSize: '30px' }, h2: { fontSize: '24px' } },
});

const renderTitle = (children?: ReactNode, disabled?: boolean) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <SingleViewTitle
          loading={false}
          title="Kultur"
          saveBtnTitle="save"
          saveAndCloseBtnTitle="saveAndClose"
          closePath="/articles/tags"
          setCloseFn={vi.fn()}
          disabled={disabled}
        >
          {children}
        </SingleViewTitle>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('SingleViewTitle', () => {
  it('wears the same size as a list view title', () => {
    renderTitle();

    const heading = screen.getByRole('heading', { name: 'Kultur' });

    expect(getComputedStyle(heading).fontSize).toBe('24px');
  });

  it('puts the actions a view brings of its own ahead of saving', () => {
    renderTitle(<button>Deactivate</button>);

    expect(
      screen.getAllByRole('button').map(button => button.textContent)
    ).toEqual(['Deactivate', 'save', 'saveAndClose']);
  });

  it('lines the actions up with each other', () => {
    renderTitle(<button>Deactivate</button>);

    const style = getComputedStyle(
      screen.getByTestId('saveButton').parentElement as HTMLElement
    );

    expect(style.display).toBe('flex');
    expect(style.alignItems).toBe('center');
  });

  it('can be told that saving is not available', () => {
    renderTitle(undefined, true);

    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();
  });

  it('tells the form which of its buttons submitted it', () => {
    renderTitle();

    expect(screen.getByTestId('saveButton')).toHaveAttribute('name', 'intent');
    expect(screen.getByTestId('saveButton')).toHaveAttribute('value', 'save');
    expect(screen.getByTestId('saveAndCloseButton')).toHaveAttribute(
      'name',
      'intent'
    );
    expect(screen.getByTestId('saveAndCloseButton')).toHaveAttribute(
      'value',
      'close'
    );
  });

  it('keeps saving as the first submit button so that Enter saves', () => {
    const { container } = renderTitle(<span>Status</span>);

    expect(container.querySelector('button[type="submit"]')).toBe(
      screen.getByTestId('saveButton')
    );
  });

  it('still reports closing to views that track it themselves', () => {
    const setCloseFn = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <form onSubmit={event => event.preventDefault()}>
            <SingleViewTitle
              loading={false}
              title="Kultur"
              saveBtnTitle="save"
              saveAndCloseBtnTitle="saveAndClose"
              closePath="/articles/tags"
              setCloseFn={setCloseFn}
            />
          </form>
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('saveButton'));
    expect(setCloseFn).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('saveAndCloseButton'));
    expect(setCloseFn).toHaveBeenCalledWith(true);
  });

  it('submits with the close intent without a close callback', () => {
    const intents: Array<string | null> = [];
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);

    window.addEventListener('error', onError);

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <form
            onSubmit={event => {
              event.preventDefault();
              const submitter = (event.nativeEvent as SubmitEvent).submitter;
              intents.push(submitter?.getAttribute('value') ?? null);
            }}
          >
            <SingleViewTitle
              loading={false}
              title="Kultur"
              saveBtnTitle="save"
              saveAndCloseBtnTitle="saveAndClose"
              closePath="/articles/tags"
            />
          </form>
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('saveAndCloseButton'));
    window.removeEventListener('error', onError);

    expect(errors).toEqual([]);
    expect(intents).toEqual(['close']);
  });
});
