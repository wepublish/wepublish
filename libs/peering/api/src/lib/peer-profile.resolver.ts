import {Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {PeerProfile} from './peer-profile.model'
import {PeerProfileService} from './peer-profile.service'
import {Image} from '@wepublish/image/api'
import {PrismaClient} from '@prisma/client'

@Resolver(() => PeerProfile)
export class PeerProfileResolver {
  constructor(private peerProfileService: PeerProfileService, private prisma: PrismaClient) {}

  @Public()
  @Query(() => PeerProfile, {
    description: 'This query returns the peer profile.'
  })
  async peerProfile(): Promise<PeerProfile> {
    return this.peerProfileService.getPeerProfile()
  }

  @ResolveField(() => Image, {nullable: true})
  async logo(@Parent() profile: PeerProfile): Promise<Image | null> {
    if (!profile.logo?.id) return null

    const image = await this.prisma.image.findUnique({
      where: {id: profile.logo.id}
    })

    return image
  }

  @ResolveField(() => Image, {nullable: true})
  async squareLogo(@Parent() profile: PeerProfile): Promise<Image | null> {
    if (!profile.squareLogo?.id) return null

    const image = await this.prisma.image.findUnique({
      where: {id: profile.squareLogo.id}
    })

    return image
  }

  @ResolveField(() => Image, {nullable: true})
  async callToActionImage(@Parent() profile: PeerProfile): Promise<Image | null> {
    if (!profile.callToActionImage?.id) return null

    const image = await this.prisma.image.findUnique({
      where: {id: profile.callToActionImage.id}
    })

    return image
  }
}
