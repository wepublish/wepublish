import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

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
});
