import { CollapsibleRender } from './collapsible/collapsible.component';
import { ContainerRender } from './container/container.component';
import { DynamicGridRender } from './dynamic-grid/dynamic-grid.component';
import { GridRender } from './grid/grid.component';
import { LayoutBlockProps, layoutBlockRegistry } from './layout.registry';
import { RowRender } from './row/row.component';
import { SliderRender } from './slider/slider.component';
import { SpaceRender } from './space/space.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

vi.mock('@wepublish/block-content/website', () => ({
  Slider: vi.fn(() => null),
}));

describe('layoutBlockRegistry', () => {
  it('renders every layout block with its website component', () => {
    expect(
      Object.fromEntries(
        Object.entries(layoutBlockRegistry).map(([type, { component }]) => [
          type,
          component,
        ])
      )
    ).toEqual({
      Space: SpaceRender,
      Grid: GridRender,
      DynamicGrid: DynamicGridRender,
      Row: RowRender,
      Slider: SliderRender,
      Container: ContainerRender,
      Collapsible: CollapsibleRender,
    });
  });

  it('keeps the side margins of a container to its own centring', () => {
    expect(layoutBlockRegistry.Container.marginSides).toEqual([
      'top',
      'bottom',
    ]);
    expect(
      Object.entries(layoutBlockRegistry)
        .filter(([, { marginSides }]) => marginSides)
        .map(([type]) => type)
    ).toEqual(['Container']);
  });

  it('names the stored props of every layout block', () => {
    expectTypeOf<keyof LayoutBlockProps>().toEqualTypeOf<
      | 'Space'
      | 'Grid'
      | 'DynamicGrid'
      | 'Row'
      | 'Slider'
      | 'Container'
      | 'Collapsible'
    >();
    expectTypeOf<LayoutBlockProps['Grid']>().not.toHaveProperty('className');
    expectTypeOf<LayoutBlockProps['Grid']['content']>().toEqualTypeOf<[]>();
    expectTypeOf<
      LayoutBlockProps['Slider']['items'][number]['content']
    >().toEqualTypeOf<[]>();
  });
});
