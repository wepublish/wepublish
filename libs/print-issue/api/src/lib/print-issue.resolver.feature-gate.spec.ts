import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { PrintIssueResolver } from './print-issue.resolver';

// The print export is Neue Wege's for now, so the whole resolver ships dark.
describe('PrintIssueResolver print-export gate', () => {
  it('requires the feature for every operation', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, PrintIssueResolver)
    ).toEqual(['print-export']);
  });
});
