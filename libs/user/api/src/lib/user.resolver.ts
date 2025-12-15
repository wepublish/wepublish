import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanCreateUser,
  CanDeleteUser,
  CanGetUser,
  CanGetUsers,
} from '@wepublish/permissions';
import {
  CreateUserInput,
  User,
  UserListArgs,
  PaginatedSensitiveDataUsers,
  UpdateUserInput,
  UpdateCurrentUserInput,
  SensitiveDataUser,
} from './user.model';
import { UserService } from './user.service';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { UserDataloaderService } from './user-dataloader.service';
import { hasPermission, Permissions } from '@wepublish/permissions/api';
import { NotFoundException } from '@nestjs/common';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { User as PUser } from '@prisma/client';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private service: UserService,
    private dataloader: UserDataloaderService,

    private imageDataloader: ImageDataloaderService
  ) {}

  @Permissions(CanGetUsers)
  @Query(() => PaginatedSensitiveDataUsers, {
    description: `Returns a paginated list of users based on the filters given.`,
  })
  public users(@Args() filter: UserListArgs) {
    return this.service.getUsers(filter);
  }

  @Permissions(CanGetUser)
  @Query(() => SensitiveDataUser, { description: `Returns a user by id.` })
  public async user(@Args('id') id: string) {
    const user = await this.dataloader.load(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found.`);
    }

    return user;
  }

  @Permissions(CanCreateUser)
  @Mutation(() => SensitiveDataUser, {
    description: `Resets the password of a user.`,
  })
  public resetPassword(
    @Args('id') id: string,
    @Args('password', { nullable: true }) password?: string,
    @Args('sendMail', { nullable: true }) sendMail?: boolean
  ) {
    return this.service.resetPassword(id, password, sendMail);
  }

  @Permissions(CanCreateUser)
  @Mutation(() => SensitiveDataUser, { description: `Creates a new user.` })
  public createUser(@Args() user: CreateUserInput) {
    return this.service.createUser(user);
  }

  @Permissions(CanCreateUser)
  @Mutation(() => SensitiveDataUser, {
    description: `Updates an existing user.`,
  })
  public updateUser(@Args() input: UpdateUserInput) {
    return this.service.updateUser({
      ...input,
    });
  }

  @Authenticated()
  @Mutation(() => SensitiveDataUser, {
    description: `Updates the current logged in user.`,
  })
  public updateCurrentUser(
    @Args() input: UpdateCurrentUserInput,
    @CurrentUser() { user }: UserSession
  ) {
    return this.service.updateUser({
      ...input,
      id: user.id,
    });
  }

  @Permissions(CanDeleteUser)
  @Mutation(() => SensitiveDataUser, {
    description: `Deletes an existing user.`,
  })
  public deleteUser(@Args('id') id: string) {
    return this.service.deleteUser(id);
  }

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() user: PUser) {
    const { userImageID } = user;

    if (!userImageID) {
      return null;
    }

    return this.imageDataloader.load(userImageID);
  }

  @ResolveField(() => String, { nullable: true })
  public note(
    @Parent() user: PUser,
    @CurrentUser() session: UserSession | undefined
  ) {
    if (!hasPermission(CanGetUser, session?.roles ?? [])) {
      return null;
    }

    return user.note;
  }
}
