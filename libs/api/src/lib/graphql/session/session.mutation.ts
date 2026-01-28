import { PrismaClient, User } from '@prisma/client';
import nanoid from 'nanoid/generate';
import { Context } from '../../context';
import { AuthSessionType } from '@wepublish/authentication/api';
import { unselectPassword } from '@wepublish/authentication/api';
import { InvalidCredentialsError, NotActiveError } from '../../error';
import { getUserForCredentials } from '../user/user.queries';

const IDAlphabet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateToken() {
  return nanoid(IDAlphabet, 32);
}

export const revokeSessionByToken = (
  authenticateUser: Context['authenticateUser'],
  sessionClient: PrismaClient['session']
) => {
  const session = authenticateUser();

  return session ?
      sessionClient.delete({
        where: {
          token: session.token,
        },
      })
    : Promise.resolve();
};

export const createUserSession = async (
  user: User,
  sessionTTL: number,
  sessionClient: PrismaClient['session'],
  userRoleClient: PrismaClient['userRole']
) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + sessionTTL);

  const { id, createdAt } = await sessionClient.create({
    data: {
      token,
      userID: user.id,
      expiresAt,
    },
  });

  return {
    type: AuthSessionType.User,
    id,
    user,
    token,
    createdAt,
    expiresAt,
    roles: await userRoleClient.findMany({
      where: {
        id: {
          in: user.roleIDs,
        },
      },
    }),
  };
};

export const createSession = async (
  email: string,
  password: string,
  sessionTTL: Context['sessionTTL'],
  sessionClient: PrismaClient['session'],
  userClient: PrismaClient['user'],
  userRoleClient: PrismaClient['userRole']
) => {
  const user = await getUserForCredentials(email, password, userClient);
  if (!user) throw new InvalidCredentialsError();
  if (!user.active) throw new NotActiveError();

  return await createUserSession(
    user,
    sessionTTL,
    sessionClient,
    userRoleClient
  );
};

export const createJWTSession = async (
  jwt: string,
  sessionTTL: Context['sessionTTL'],
  verifyJWT: Context['verifyJWT'],
  sessionClient: PrismaClient['session'],
  userClient: PrismaClient['user'],
  userRoleClient: PrismaClient['userRole']
) => {
  const userID = verifyJWT(jwt);

  const user = await userClient.findUnique({
    where: { id: userID },
    select: unselectPassword,
  });
  if (!user) throw new InvalidCredentialsError();
  if (!user.active) throw new NotActiveError();

  return await createUserSession(
    user,
    sessionTTL,
    sessionClient,
    userRoleClient
  );
};
