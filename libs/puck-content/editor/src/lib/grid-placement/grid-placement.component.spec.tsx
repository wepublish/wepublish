import { fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { GridPlacementFieldRender } from './grid-placement.component';
import { GridLine, GridPlacementField } from './grid-placement.field';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initImmediate: false,
  interpolation: { escapeValue: false },
});

const renderPlacement = (
  value: GridLine | undefined,
  {
    onChange = vi.fn(),
    readOnly,
    ...field
  }: Partial<Omit<GridPlacementField, 'type'>> & {
    onChange?: (value: GridLine | undefined) => void;
    readOnly?: boolean;
  } = {}
) =>
  render(
    <I18nextProvider i18n={i18n}>
      <GridPlacementFieldRender
        id="placement"
        name="placement"
        field={{ type: 'gridPlacement', axis: 'column', ...field }}
        value={value as GridLine}
        readOnly={readOnly}
        onChange={onChange}
      />
    </I18nextProvider>
  );

describe('GridPlacementFieldRender', () => {
  it('labels the start and span of the columns', () => {
    renderPlacement({ start: 3, span: 4 });

    expect(
      screen.getByRole('spinbutton', { name: 'Start column' })
    ).toHaveValue(3);
    expect(screen.getByRole('spinbutton', { name: 'Column span' })).toHaveValue(
      4
    );
  });

  it('labels the start and span of the rows', () => {
    renderPlacement({ span: 2 }, { axis: 'row' });

    expect(screen.getByRole('spinbutton', { name: 'Start row' })).toHaveValue(
      null
    );
    expect(screen.getByRole('spinbutton', { name: 'Row span' })).toHaveValue(2);
    expect(
      screen.getByText('Spans 2 rows, placed automatically')
    ).toBeVisible();
  });

  it('shows which columns the cell covers', () => {
    renderPlacement({ start: 3, span: 4 });

    expect(screen.getByText('Columns 3–6')).toBeVisible();
    expect(
      screen.getByRole('spinbutton', { name: 'Start column' })
    ).toHaveAccessibleDescription('Columns 3–6');
  });

  it('names a single column and an automatic placement', () => {
    const { unmount } = renderPlacement({ start: 5 });
    expect(screen.getByText('Column 5')).toBeVisible();
    unmount();

    renderPlacement({});
    expect(screen.getByText('Placed automatically')).toBeVisible();
  });

  it('bounds the inputs by the columns', () => {
    renderPlacement({ start: 3 }, { columns: 6 });

    expect(
      screen.getByRole('spinbutton', { name: 'Start column' })
    ).toHaveAttribute('max', '6');
    expect(
      screen.getByRole('spinbutton', { name: 'Column span' })
    ).toHaveAttribute('max', '4');
  });

  it('keeps the span inside the columns when the start moves', () => {
    const onChange = vi.fn();
    renderPlacement({ start: 3, span: 8 }, { onChange });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Start column' }), {
      target: { value: '9' },
    });

    expect(onChange).toHaveBeenCalledWith({ start: 9, span: 4 });
  });

  it('returns to automatic placement when the start is emptied', () => {
    const onChange = vi.fn();
    renderPlacement({ start: 3, span: 4 }, { onChange });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Start column' }), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({ span: 4 });
  });

  it('disables the inputs when read only', () => {
    renderPlacement({ start: 3, span: 4 }, { readOnly: true });

    expect(
      screen.getByRole('spinbutton', { name: 'Start column' })
    ).toBeDisabled();
    expect(
      screen.getByRole('spinbutton', { name: 'Column span' })
    ).toBeDisabled();
  });

  it('can be switched off to inherit the placement', () => {
    const onChange = vi.fn();
    renderPlacement({ span: 4 }, { label: 'Columns', onChange });

    fireEvent.click(screen.getByRole('switch', { name: 'Columns' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(
      screen.queryByRole('spinbutton', { name: 'Column span' })
    ).not.toBeInTheDocument();
  });
});
