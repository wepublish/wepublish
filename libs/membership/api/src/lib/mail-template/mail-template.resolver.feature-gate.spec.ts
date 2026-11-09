import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { MailTemplatesResolver } from './mail-template.resolver';

const featuresOf = (method: keyof MailTemplatesResolver) =>
  Reflect.getMetadata(
    FEATURE_METADATA_KEY,
    MailTemplatesResolver.prototype[method]
  );

// Letters ship dark: without the feature the editor must not even learn
// whether a letter integration exists.
describe('MailTemplatesResolver paper-letters gate', () => {
  it('gates the letter channel query', () => {
    expect(featuresOf('letterChannelAvailable')).toEqual(['paper-letters']);
  });

  it('gates the letter preview', () => {
    expect(featuresOf('mailTemplateLetterPreview')).toEqual(['paper-letters']);
  });

  it('leaves the mail side open', () => {
    expect(featuresOf('mailTemplates')).toBeUndefined();
    expect(featuresOf('mailTemplatePreview')).toBeUndefined();
  });
});
