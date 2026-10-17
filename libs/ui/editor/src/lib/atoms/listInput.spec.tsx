import { createTheme, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ListInput } from './listInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ListInput', () => {
  it('gives the fields the whole width of the row', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <ListInput
          value={[{ id: 'a', value: 'key' }]}
          onChange={vi.fn()}
          defaultValue=""
        >
          {({ value }) => (
            <input
              data-testid="field"
              value={value}
              onChange={() => undefined}
            />
          )}
        </ListInput>
      </ThemeProvider>
    );

    const fields = screen.getByTestId('field').parentElement as HTMLElement;

    expect(getComputedStyle(fields).flexGrow).toBe('1');
  });

  it('picks a row up from the keyboard and announces it to screen readers', async () => {
    const { container, baseElement } = render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <ListInput
          value={[
            { id: 'a', value: 'first' },
            { id: 'b', value: 'second' },
          ]}
          onChange={vi.fn()}
          defaultValue=""
        >
          {({ value }) => (
            <input
              value={value}
              onChange={() => undefined}
            />
          )}
        </ListInput>
      </ThemeProvider>
    );

    const handle = container.querySelector<HTMLElement>(
      '[aria-roledescription="sortable"]'
    ) as HTMLElement;

    handle.focus();
    await act(async () => {
      fireEvent.keyDown(handle, { key: ' ', code: 'Space' });
    });

    expect(baseElement.querySelector('[role="status"]')?.textContent).toContain(
      'Picked up draggable item'
    );
  });
});
