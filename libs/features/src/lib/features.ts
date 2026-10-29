/**
 * `alpha`: switched on for one medium while it is being built.
 * `beta`: usable, switched on for media that asked for it.
 */
export type FeatureStage = 'alpha' | 'beta';

export type Feature = {
  key: string;
  description: string;
  stage: FeatureStage;
};

/**
 * One validates the keys a CMS reports with the same pattern, so a key that
 * passes here is never refused there.
 */
export const FEATURE_KEY_PATTERN = /^[a-z][a-z0-9-]{1,47}$/;

/**
 * Features that ship dark and are switched on per medium in We.Publish One.
 * A feature that is ready for every medium is removed from this list together
 * with its `@Feature` / `useFeature` checks; it is then simply on.
 */
export const FEATURES = [
  {
    key: 'newsletter-editor',
    description: 'Newsletter editor: build issues and push them to Mailchimp',
    stage: 'alpha',
  },
  {
    key: 'profile-subscription-history',
    description:
      'Profile: subscriptions with their latest invoices as one table, and an edit page per subscription',
    stage: 'alpha',
  },
  {
    key: 'paper-letters',
    description:
      'Printed letters: letter provider and pdf renderer integrations, letter layouts, the letter channel in the communication tool',
    stage: 'beta',
  },
  {
    key: 'paper-letter-flow',
    description:
      'Per-user delivery mode: automated subscription mails printed as letters, with suggestions from the email quality',
    stage: 'alpha',
  },
] as const satisfies readonly Feature[];

export type FeatureKey = (typeof FEATURES)[number]['key'];

export const isKnownFeature = (
  key: string,
  registry: readonly Feature[] = FEATURES
): boolean => registry.some(feature => feature.key === key);
