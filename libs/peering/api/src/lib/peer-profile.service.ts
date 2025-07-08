import {Inject, Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {PeerProfile} from './peer-profile.model'
import {Image} from '@wepublish/image/api'
import {PEER_MODULE_OPTIONS, PeerModuleOptions} from './peer.constants'
import {Descendant} from 'slate'

@Injectable()
export class PeerProfileService {
  constructor(
    private prisma: PrismaClient,
    @Inject(PEER_MODULE_OPTIONS) private options: PeerModuleOptions
  ) {}

  async getPeerProfile(): Promise<PeerProfile> {
    const {hostURL, websiteURL} = this.options

    // @TODO: move fallback to seed
    const profile = (await this.prisma.peerProfile.findFirst({})) ?? {
      name: '',
      themeColor: '#000000',
      themeFontColor: '#ffffff',
      callToActionURL: '',
      callToActionText: [],
      logoID: null,
      squareLogoId: null,
      callToActionImageID: null,
      callToActionImageURL: ''
    }

    let logo: Image | undefined = undefined
    let squareLogo: Image | undefined = undefined
    let callToActionImage: Image | undefined = undefined

    if (profile.logoID) {
      logo = {id: profile.logoID} as Image
    }

    if (profile.squareLogoId) {
      squareLogo = {id: profile.squareLogoId} as Image
    }

    if (profile.callToActionImageID) {
      callToActionImage = {id: profile.callToActionImageID} as Image
    }

    return {
      name: profile.name,
      themeColor: profile.themeColor,
      themeFontColor: profile.themeFontColor,
      callToActionText: profile.callToActionText as unknown as Descendant[],
      callToActionURL: profile.callToActionURL,
      callToActionImageURL: profile.callToActionImageURL ?? undefined,
      logoID: profile.logoID ?? undefined,
      squareLogoId: profile.squareLogoId ?? undefined,
      callToActionImageID: profile.callToActionImageID ?? undefined,
      hostURL,
      websiteURL,
      logo,
      squareLogo,
      callToActionImage
    }
  }
}
