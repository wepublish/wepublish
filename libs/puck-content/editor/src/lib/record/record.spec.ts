import { recordPlugin } from './record';
import { RecordFieldRender } from './record-select.component';

describe('recordPlugin', () => {
  it('renders the record field type', () => {
    expect(recordPlugin.overrides?.fieldTypes?.record).toBe(RecordFieldRender);
  });
});
