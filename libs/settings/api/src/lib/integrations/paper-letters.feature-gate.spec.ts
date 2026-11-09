import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { LetterProviderSettingsResolver } from './letter-provider-settings.resolver';
import { PdfRendererSettingsResolver } from './pdf-renderer-settings.resolver';

// Both integrations only serve letters, so they stay hidden with the feature.
describe('letter integration resolvers paper-letters gate', () => {
  it('gates the letter provider settings', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, LetterProviderSettingsResolver)
    ).toEqual(['paper-letters']);
  });

  it('gates the pdf renderer settings', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, PdfRendererSettingsResolver)
    ).toEqual(['paper-letters']);
  });
});
