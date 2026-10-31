import { SessionOrigin } from '@prisma/client';

export type SessionRestrictionInput = {
  origin: SessionOrigin;
  placeholderEmail: boolean;
  emailVerifiedAt: Date | null | undefined;
  sessionCreatedAt: Date;
};

export const isSessionRestricted = ({
  origin,
  placeholderEmail,
  emailVerifiedAt,
  sessionCreatedAt,
}: SessionRestrictionInput): boolean => {
  if (origin === SessionOrigin.impersonation) {
    return false;
  }

  if (placeholderEmail) {
    return true;
  }

  if (origin !== SessionOrigin.purl) {
    return false;
  }

  return !emailVerifiedAt || emailVerifiedAt < sessionCreatedAt;
};
