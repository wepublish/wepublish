import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';

export const isMeBySession = (
  id: string,
  session: AuthSession | null | undefined
) => session?.type === AuthSessionType.User && session.user.id === id;
