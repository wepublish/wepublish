import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { LetterLayoutResolver } from './letter-layout.resolver';

// Stationery only exists for letters, so the whole resolver ships dark.
describe('LetterLayoutResolver paper-letters gate', () => {
  it('requires the feature for every operation', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, LetterLayoutResolver)
    ).toEqual(['paper-letters']);
  });
});
