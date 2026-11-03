import { DynamicGrid } from './dynamic-grid/dynamic-grid.config';
import { defaultGridPlacement } from './grid-placement.field';

const itemFields = (
  DynamicGrid.fields as unknown as {
    items: { arrayFields: Record<string, unknown>; defaultItemProps: unknown };
  }
).items;

describe('DynamicGrid item placement', () => {
  it('places every item per breakpoint by column and row', () => {
    expect(itemFields.arrayFields).not.toHaveProperty('span');
    expect(itemFields.arrayFields['placement']).toMatchObject({
      type: 'breakpoints',
      objectFields: {
        column: { type: 'gridPlacement', axis: 'column', columns: 12 },
        row: { type: 'gridPlacement', axis: 'row' },
      },
    });
  });

  it('spans new items over the full width on phones and half from md', () => {
    expect(defaultGridPlacement).toEqual({
      xs: { column: { span: 12 } },
      md: { column: { span: 6 } },
    });
    expect(itemFields.defaultItemProps).toMatchObject({
      placement: defaultGridPlacement,
    });
  });

  it('teaches the AI to offset items with a start column', () => {
    expect(DynamicGrid.ai?.instructions).toContain('placement');
    expect(DynamicGrid.ai?.instructions).toContain('start');
    expect(DynamicGrid.ai?.instructions).not.toContain(
      'column span and row span'
    );
  });
});
