/**
 * Secrets never come back from the API, so the field always starts empty.
 * The placeholder tells whether one is stored, which an empty save keeps.
 */
export const secretPlaceholder = (
  stored: boolean | null | undefined,
  t: (key: string) => string = key => key
) => t(stored ? 'integrations.secretStored' : 'integrations.secretNotSet');
