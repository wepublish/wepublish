import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseUser, SensitiveDataUser } from './user.model';
import { Property } from '@wepublish/property/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { hasPermission } from '@wepublish/permissions/api';
import { CanGetUser } from '@wepublish/permissions';

@Resolver(() => BaseUser)
export class BaseUserResolver {
  constructor(private imageDataloaderService: ImageDataloaderService) {}

  @ResolveField(() => Image)
  public async image(@Parent() { image, userImageID }: BaseUser) {
    if (!userImageID) {
      return null;
    }

    if (image !== undefined) {
      return image;
    }

    return this.imageDataloaderService.load(userImageID);
  }

  @ResolveField(() => [Property])
  public async properties(
    @Parent() { properties }: SensitiveDataUser,
    @CurrentUser() user: UserSession | undefined
  ) {
    return properties?.filter(
      prop => prop.public || hasPermission(CanGetUser, user?.roles ?? [])
    );
  }
}
