import { describe, expect, it } from 'vitest';
import { featureKeysOf, featureKeysIn } from './feature-tags';

describe('featureKeysOf', () => {
  it('names the features a scenario needs', () => {
    expect(
      featureKeysOf(['@membership', '@feature:referrals', '@mutating'])
    ).toEqual(['referrals']);
  });

  it('is empty for a scenario without feature tags', () => {
    expect(featureKeysOf(['@membership', '@app:bajour'])).toEqual([]);
  });
});

describe('featureKeysIn', () => {
  it('collects the feature tags of all feature files once each', () => {
    expect(
      featureKeysIn([
        '@membership @feature:referrals\nFeature: Referral discount codes',
        '@feature:referrals @feature:newsletter-editor\nFeature: Other',
        'Feature: Untagged',
      ])
    ).toEqual(['referrals', 'newsletter-editor']);
  });

  it('ignores tags in comments and steps', () => {
    expect(
      featureKeysIn([
        '# @feature:commented\nFeature: X\n  Scenario: Y\n    Given a "@feature:quoted" text',
      ])
    ).toEqual([]);
  });
});
