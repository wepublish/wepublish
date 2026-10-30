import {
  FEATURE_KEY_PATTERN,
  FEATURES,
  type Feature,
  isKnownFeature,
} from './features';

const registry: readonly Feature[] = [
  { key: 'newsletter', description: 'Newsletter editor', stage: 'alpha' },
];

// widened: the registry may be empty, and an empty tuple has `never` entries
const features: readonly Feature[] = FEATURES;

describe('FEATURES', () => {
  it('has unique keys', () => {
    const keys = features.map(feature => feature.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only has keys that One accepts', () => {
    for (const feature of features) {
      expect(feature.key).toMatch(FEATURE_KEY_PATTERN);
    }
  });
});

describe('FEATURE_KEY_PATTERN', () => {
  it('accepts lowercase keys with dashes', () => {
    expect('newsletter').toMatch(FEATURE_KEY_PATTERN);
    expect('nw-print-export').toMatch(FEATURE_KEY_PATTERN);
  });

  it('refuses anything a header, url or log line could choke on', () => {
    expect('Newsletter').not.toMatch(FEATURE_KEY_PATTERN);
    expect('news letter').not.toMatch(FEATURE_KEY_PATTERN);
    expect('-newsletter').not.toMatch(FEATURE_KEY_PATTERN);
    expect('a').not.toMatch(FEATURE_KEY_PATTERN);
    expect('a'.repeat(49)).not.toMatch(FEATURE_KEY_PATTERN);
  });
});

describe('isKnownFeature', () => {
  it('knows the keys of the registry', () => {
    expect(isKnownFeature('newsletter', registry)).toBe(true);
  });

  it('does not know keys outside the registry', () => {
    expect(isKnownFeature('released-long-ago', registry)).toBe(false);
  });

  it('checks the real registry by default', () => {
    expect(isKnownFeature('surely-not-a-feature')).toBe(false);
  });

  it('knows the profile subscription history', () => {
    expect(isKnownFeature('profile-subscription-history')).toBe(true);
  });
});
