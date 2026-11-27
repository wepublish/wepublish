import { SessionOrigin } from '@prisma/client';

export const SESSION_RESTRICTED = 'SESSION_RESTRICTED';

export type SessionRestrictionInput = {
  origin: SessionOrigin;
  placeholderEmail: boolean;
  /** The account holds nothing beyond reader access. */
  readerOnly: boolean;
  /** When this very session confirmed an email address, if it did. */
  emailConfirmedAt: Date | null | undefined;
};

/**
 * A restricted session may only finish setting up its account. A login-code
 * session stays restricted until it confirms an address itself: that someone
 * else confirmed the account's address says nothing about who holds the code.
 */
export const isSessionRestricted = ({
  origin,
  placeholderEmail,
  readerOnly,
  emailConfirmedAt,
}: SessionRestrictionInput): boolean => {
  if (origin === SessionOrigin.impersonation) {
    return false;
  }

  // Staff are not sent through the reader's account setup, or a placeholder
  // pattern that happens to match would lock them out of the editor.
  if (placeholderEmail && readerOnly) {
    return true;
  }

  if (origin !== SessionOrigin.purl) {
    return false;
  }

  return !emailConfirmedAt;
};
