import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasUser,
  HasUserLc,
  HasOptionalUser,
  HasOptionalUserLc,
} from './has-user.model';
import { User } from '../user.model';
import { UserDataloaderService } from '../user-dataloader.service';

@Resolver(() => HasUser)
export class HasUserResolver {
  constructor(private dataloader: UserDataloaderService) {}

  @ResolveField(() => User, { nullable: true })
  public user(
    @Parent() block: HasOptionalUser | HasUser | HasOptionalUserLc | HasUserLc
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

@Resolver(() => HasUserLc)
export class HasUserLcResolver extends HasUserResolver {}

@Resolver(() => HasOptionalUser)
export class HasOptionalUserResolver extends HasUserResolver {}

@Resolver(() => HasOptionalUserLc)
export class HasOptionalUserLcResolver extends HasUserResolver {}
