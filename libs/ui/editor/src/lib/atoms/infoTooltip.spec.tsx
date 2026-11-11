import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { InfoTooltip, InfoTrigger } from './infoTooltip';

const theme = createTheme({ cssVariables: true });

describe('InfoTooltip', () => {
  it('explains itself when it is pointed at', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InfoTooltip text="Applies to new articles only." />
      </ThemeProvider>
    );

    fireEvent.mouseOver(
      screen.getByRole('button', { name: 'Applies to new articles only.' })
    );

    expect((await screen.findByRole('tooltip')).textContent).toContain(
      'Applies to new articles only.'
    );
  });

  it('can be named separately from a longer explanation', () => {
    render(
      <ThemeProvider theme={theme}>
        <InfoTooltip
          label="What is this?"
          text={<p>A longer explanation.</p>}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: 'What is this?' })).toBeTruthy();
  });

  it('keeps its short name and offers the explanation as its description', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InfoTooltip
          label="What is this?"
          text="A longer explanation."
        />
      </ThemeProvider>
    );

    fireEvent.mouseOver(screen.getByRole('button', { name: 'What is this?' }));
    await screen.findByRole('tooltip');

    expect(
      screen.getByRole('button', { name: 'What is this?' })
    ).toHaveAccessibleDescription('A longer explanation.');
  });
});

describe('InfoTrigger', () => {
  it('never submits the form it sits in', () => {
    const onSubmit = vi.fn(event => event.preventDefault());

    render(
      <ThemeProvider theme={theme}>
        <form onSubmit={onSubmit}>
          <InfoTrigger aria-label="Info" />
        </form>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
