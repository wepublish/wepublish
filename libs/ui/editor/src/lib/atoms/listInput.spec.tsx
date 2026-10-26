import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';

import { ListInput, ListValue } from './listInput';

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

  describe('inside a react-hook-form Controller', () => {
    let form: UseFormReturn<{ items: ListValue<string>[] }>;

    function Form() {
      form = useForm({
        defaultValues: { items: [{ id: 'a', value: 'first' }] },
      });

      return (
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <Controller
            control={form.control}
            name="items"
            render={({ field }) => (
              <ListInput
                value={field.value}
                onChange={field.onChange}
                defaultValue="new"
              >
                {({ value, onChange }) => (
                  <input
                    aria-label="item"
                    value={value}
                    onChange={event => onChange(event.target.value)}
                  />
                )}
              </ListInput>
            )}
          />
        </ThemeProvider>
      );
    }

    const items = () => form.getValues('items').map(({ value }) => value);

    it('stores the list when an item is added', () => {
      render(<Form />);

      fireEvent.click(screen.getByRole('button', { name: 'listInput.add' }));

      expect(items()).toEqual(['first', 'new']);
    });

    it('stores the list when an item is edited', () => {
      render(<Form />);

      fireEvent.change(screen.getByRole('textbox', { name: 'item' }), {
        target: { value: 'edited' },
      });

      expect(items()).toEqual(['edited']);
    });

    it('stores the list when an item is removed', () => {
      render(<Form />);

      fireEvent.click(screen.getByRole('button', { name: 'delete' }));

      expect(form.getValues('items')).toEqual([]);
    });
  });
});
