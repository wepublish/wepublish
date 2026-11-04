const FEATURE_TAG = '@feature:';

/**
 * `@feature:<key>` needs a feature switched on for the medium (We.Publish
 * One, or `WEP_FEATURES`). The `capabilities` fixture asks the API and skips
 * the scenario when it is off; the local stack switches on every key the
 * feature files name.
 */
export const featureKeysOf = (tags: string[]): string[] =>
  tags
    .filter(tag => tag.startsWith(FEATURE_TAG))
    .map(tag => tag.slice(FEATURE_TAG.length));

/** The `@feature:` keys on the tag lines of the given feature files. */
export const featureKeysIn = (featureFiles: string[]): string[] => [
  ...new Set(
    featureFiles.flatMap(text =>
      text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('@'))
        .flatMap(line => featureKeysOf(line.split(/\s+/)))
    )
  ),
];
