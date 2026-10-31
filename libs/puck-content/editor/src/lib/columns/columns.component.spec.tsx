import { fireEvent, render, screen } from '@testing-library/react';

import { ColumnsFieldRender } from './columns.component';

const renderColumns = (value: number[] | undefined, onChange = vi.fn()) =>
  render(
    <ColumnsFieldRender
      id="columns"
      name="columns"
      field={{ type: 'columns' }}
      value={value as number[]}
      onChange={onChange}
    />
  );

describe('ColumnsFieldRender', () => {
  it('names every preset by its column widths and marks the chosen one', () => {
    renderColumns([1, 2]);

    expect(screen.getByRole('button', { name: '33% / 67%' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      screen.getByRole('button', { name: '25% / 25% / 25% / 25%' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('chooses a preset', () => {
    const onChange = vi.fn();

    renderColumns([1], onChange);
    fireEvent.click(screen.getByRole('button', { name: '50% / 50%' }));

    expect(onChange).toHaveBeenCalledWith([1, 1]);
  });
});
