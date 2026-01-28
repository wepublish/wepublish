import { PrismaClient } from '@prisma/client';
import { getPeerProfile } from './peer-profile.queries';

export const getPublicPeerProfile = async (
  hostURL: string,
  websiteURL: string,
  peerProfile: PrismaClient['peerProfile']
) => getPeerProfile(hostURL, websiteURL, peerProfile);
