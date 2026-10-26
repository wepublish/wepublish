import { createTheme, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';

import { ListInput, ListValue } from './listInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { index?: number }) =>
      options?.index ? `${key} ${options.index}` : key,
  }),
}));

const theme = createTheme({ cssVariables: true });

const rows: ListValue<string>[] = [
  { id: 'a', value: 'first' },
  { id: 'b', value: 'second' },
  { id: 'c', value: 'third' },
];

const renderList = (
  props: Partial<ComponentProps<typeof ListInput<string>>> = {}
) => {
  const onChange = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <ListInput<string>
        value={rows}
        onChange={onChange}
        defaultValue=""
        {...props}
      >
        {({ value }) => (
          <input
            aria-label="item"
            value={value}
            onChange={() => undefined}
          />
        )}
      </ListInput>
    </ThemeProvider>
  );

  return onChange;
};

describe('ListInput', () => {
  describe('reordering by keyboard', () => {
    let rectSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      rectSpy = vi
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: Element) {
          const index =
            this.tagName === 'LI' && this.parentElement ?
              [...this.parentElement.children].indexOf(this)
            : 0;
          const top = index * 50;

          return {
            x: 0,
            y: top,
            top,
            left: 0,
            right: 400,
            bottom: top + 40,
            width: 400,
            height: 40,
            toJSON: () => undefined,
          } as DOMRect;
        });
    });

    afterEach(() => {
      rectSpy.mockRestore();
    });

    it('moves a row down with Space, ArrowDown and Space on its drag handle', async () => {
      const onChange = renderList();
      const [handle] = screen.getAllByRole('button', {
        name: 'listInput.dragToReorder',
      });

      const press = async (code: string, key: string) => {
        await act(async () => {
          fireEvent.keyDown(handle, { code, key });
          await new Promise(resolve => setTimeout(resolve, 0));
        });
      };

      handle.focus();

      await press('Space', ' ');
      await press('ArrowDown', 'ArrowDown');
      await press('Space', ' ');

      expect(onChange).toHaveBeenCalledWith([rows[1], rows[0], rows[2]]);
    });

    it('gives each row one drag handle, focusable and not nested in another control', () => {
      renderList();

      const handles = screen.getAllByRole('button', {
        name: 'listInput.dragToReorder',
      });

      expect(handles).toHaveLength(rows.length);

      for (const handle of handles) {
        expect(handle.tabIndex).toBe(0);
        expect(
          handle.parentElement?.closest('button, [role="button"], [tabindex]')
        ).toBeNull();
      }
    });
  });

  it('numbers the rows from 1 when showIndex is set', () => {
    renderList({ showIndex: true });

    expect(
      screen.getAllByTestId('list-input-index').map(node => node.textContent)
    ).toEqual(['1', '2', '3']);
  });

  it('names each numbered row in its drag handle and delete button', () => {
    renderList({ showIndex: true });

    expect(
      screen
        .getAllByRole('button', { name: /^listInput\.reorderItem/ })
        .map(button => button.getAttribute('aria-label'))
    ).toEqual([
      'listInput.reorderItem 1',
      'listInput.reorderItem 2',
      'listInput.reorderItem 3',
    ]);
    expect(
      screen
        .getAllByRole('button', { name: /^listInput\.deleteItem/ })
        .map(button => button.getAttribute('aria-label'))
    ).toEqual([
      'listInput.deleteItem 1',
      'listInput.deleteItem 2',
      'listInput.deleteItem 3',
    ]);
  });

  it('shows no row numbers by default', () => {
    renderList();

    expect(screen.queryByTestId('list-input-index')).toBeNull();
  });

  it('appends a copy of the last row under a new id with Duplicate last', () => {
    const onChange = renderList({ duplicateLastLabel: 'Duplicate last' });

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate last' }));

    const next = onChange.mock.calls[0][0] as ListValue<string>[];

    expect(next.map(({ value }) => value)).toEqual([
      'first',
      'second',
      'third',
      'third',
    ]);
    expect(new Set(next.map(({ id }) => id)).size).toBe(4);
  });

  it('lets the caller shape the duplicated value', () => {
    const onChange = renderList({
      duplicateLastLabel: 'Duplicate last',
      duplicateValue: value => `${value} again`,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate last' }));

    expect(onChange.mock.calls[0][0].at(-1).value).toBe('third again');
  });

  it('offers no Duplicate last while the list is empty', () => {
    renderList({ value: [], duplicateLastLabel: 'Duplicate last' });

    expect(screen.queryByRole('button', { name: 'Duplicate last' })).toBeNull();
  });

  it('hides Add and Duplicate last once maxItems is reached', () => {
    renderList({ maxItems: 3, duplicateLastLabel: 'Duplicate last' });

    expect(screen.queryByRole('button', { name: 'listInput.add' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Duplicate last' })).toBeNull();
  });

  it('keeps Add below maxItems', () => {
    renderList({ maxItems: 4 });

    expect(screen.getByRole('button', { name: 'listInput.add' })).toBeTruthy();
  });

  it('labels Add with addLabel when given', () => {
    renderList({ addLabel: 'Add date' });

    expect(screen.getByRole('button', { name: 'Add date' })).toBeTruthy();
  });

  it('hands Add to onAdd instead of appending a default row', () => {
    const onAdd = vi.fn();
    const onChange = renderList({ addLabel: 'Add images', onAdd });

    fireEvent.click(screen.getByRole('button', { name: 'Add images' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

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
