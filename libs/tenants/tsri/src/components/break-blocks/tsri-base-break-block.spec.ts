import { TsriAttentionCatcher } from './tsri-attention-catcher';
import { TsriBreakBlock } from './tsri-base-break-block';

describe('TsriBreakBlock', () => {
  it('loads when the attention catcher module is imported first', () => {
    expect(TsriAttentionCatcher).toBeDefined();
    expect(TsriBreakBlock).toBeInstanceOf(Function);
  });
});
