import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AuthSession,
  AuthSessionType,
  CurrentUser,
} from '@wepublish/authentication/api';
import { LoginCodeSecondFactorService } from '@wepublish/login-code/api';
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
  constructor(
    private dataloader: UserDataloaderService,
    private secondFactorService: LoginCodeSecondFactorService
  ) {}

  @ResolveField(() => User, { nullable: true })
  public async user(
    @Parent() block: HasOptionalUser | HasUser | HasOptionalUserLc | HasUserLc,
    @CurrentUser() session: AuthSession | null
  ) {
    const id =
      'userId' in block ? block.userId
      : 'userID' in block ? block.userID
      : null;

    if (!id) {
      return null;
    }

    const user = await this.dataloader.load(id);
    const ownRestrictedSession =
      session?.type === AuthSessionType.User &&
      session.restricted &&
      session.user.id === id;

    return user && ownRestrictedSession ?
        this.secondFactorService.mask(user)
      : user;
  }
}

@Resolver(() => HasUserLc)
export class HasUserLcResolver extends HasUserResolver {}

@Resolver(() => HasOptionalUser)
export class HasOptionalUserResolver extends HasUserResolver {}

@Resolver(() => HasOptionalUserLc)
export class HasOptionalUserLcResolver extends HasUserResolver {}
