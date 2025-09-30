import { delegateToSchema } from '@graphql-tools/delegate';
import { schemaFromExecutor } from '@graphql-tools/wrap';
import { PrismaClient } from '@prisma/client';
import { CanCreatePeer, CanGetPeerProfile } from '@wepublish/permissions';
import { SettingName } from '@wepublish/settings/api';
import { GraphQLResolveInfo } from 'graphql';
import { Context, createFetcher } from '../../context';
import { PeerTokenInvalidError } from '../../error';
import { markResultAsProxied } from '../../utility';
import { authorise } from '../permissions';
import { getPeerProfile } from './peer-profile.queries';
import { createSafeHostUrl } from '@wepublish/peering/api';

export const getAdminPeerProfile = async (
  hostURL: string,
  websiteURL: string,
  authenticate: Context['authenticate'],
  peerProfile: PrismaClient['peerProfile']
) => {
  const { roles } = authenticate();
  authorise(CanGetPeerProfile, roles);

  return getPeerProfile(hostURL, websiteURL, peerProfile);
};

export const getRemotePeerProfile = async (
  hostURL: string,
  token: string,
  authenticate: Context['authenticate'],
  info: GraphQLResolveInfo,
  setting: PrismaClient['setting']
) => {
  const { roles } = authenticate();
  authorise(CanCreatePeer, roles);
  const link = createSafeHostUrl(hostURL, 'v1/admin');

  const peerTimeoutSetting = await setting.findUnique({
    where: {
      name: SettingName.PEERING_TIMEOUT_MS,
    },
  });

  const peerTimeout =
    (peerTimeoutSetting?.value as number) ??
    parseInt(process.env['PEERING_TIMEOUT_IN_MS'] ?? '');

  if (!peerTimeout) {
    throw new Error('No value set for PEERING_TIMEOUT_IN_MS');
  }

  const fetcher = await createFetcher(link, token, peerTimeout);
  const remoteExecutableSchema = {
    schema: await schemaFromExecutor(fetcher),
    executor: fetcher,
  };

  const remoteAnswer = await delegateToSchema({
    info,
    fieldName: 'peerProfile',
    args: {},
    schema: remoteExecutableSchema,
    transforms: [],
  });

  if (remoteAnswer?.extensions?.code === 'UNAUTHENTICATED') {
    // check for unauthenticated error and throw more specific error.
    // otherwise client doesn't know who (own or remote api) threw the error
    throw new PeerTokenInvalidError(link);
  } else {
    return await markResultAsProxied(remoteAnswer);
  }
};
