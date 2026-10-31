import { DynamicGrid } from './dynamic-grid/dynamic-grid.config';
import { gapSchema } from './gap';
import { Grid } from './grid/grid.config';
import { Row } from './row/row.config';

describe('gapSchema', () => {
  it('describes the gap in theme spacing units or pixel strings', () => {
    expect(gapSchema().gap.description).toBe(
      'Gap between the children, as a number of theme spacing units (usually 8px each) or an exact pixel string like "12px"'
    );
  });
});

describe('gap AI instructions', () => {
  it.each([
    ['Grid', Grid.ai],
    ['DynamicGrid', DynamicGrid.ai],
    ['Row', Row.ai],
  ])('%s measures the gap in theme spacing units', (_name, ai) => {
    expect(ai?.instructions).toContain('in theme spacing units');
    expect(ai?.instructions).not.toContain('in pixels');
  });
});
