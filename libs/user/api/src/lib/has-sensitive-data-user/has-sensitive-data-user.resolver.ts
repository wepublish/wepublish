import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasSensitiveDataUser,
  HasSensitiveDataUserLc,
  HasOptionalSensitiveDataUser,
  HasOptionalSensitiveDataUserLc,
} from './has-sensitive-data-user.model';
import { SensitiveDataUser } from '../user.model';
import { UserDataloaderService } from '../user-dataloader.service';

@Resolver(() => HasSensitiveDataUser)
export class HasSensitiveDataUserResolver {
  constructor(private dataloader: UserDataloaderService) {}

  @ResolveField(() => SensitiveDataUser, { nullable: true })
  public user(
    @Parent()
    block:
      | HasOptionalSensitiveDataUser
      | HasSensitiveDataUser
      | HasOptionalSensitiveDataUserLc
      | HasSensitiveDataUserLc
  ) {
    const id =
      'userId' in block ? block.userId
      : 'userID' in block ? block.userID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasSensitiveDataUserLc)
export class HasSensitiveDataUserLcResolver extends HasSensitiveDataUserResolver {}

@Resolver(() => HasOptionalSensitiveDataUser)
export class HasOptionalSensitiveDataUserResolver extends HasSensitiveDataUserResolver {}

@Resolver(() => HasOptionalSensitiveDataUserLc)
export class HasOptionalSensitiveDataUserLcResolver extends HasSensitiveDataUserResolver {}
