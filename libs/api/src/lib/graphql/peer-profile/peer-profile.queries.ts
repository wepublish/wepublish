import { PrismaClient } from '@prisma/client';

export const getPeerProfile = async (
  hostURL: string,
  websiteURL: string,
  peerProfile: PrismaClient['peerProfile']
) => {
  // @TODO: move fallback to seed
  const profile = (await peerProfile.findFirst({})) ?? {
    name: '',
    themeColor: '#000000',
    themeFontColor: '#ffffff',
    callToActionURL: '',
    callToActionText: [],
    callToActionImageID: '',
    callToActionImageURL: '',
  };

  return { ...profile, hostURL, websiteURL };
};
