import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  CanCreateNavigation,
  CanDeleteNavigation,
  CanGetNavigations,
  Permissions
} from '@wepublish/permissions/api'
import {
  CreateNavigationInput,
  Navigation,
  NavigationArgs,
  NavigationIdArgs,
  UpdateNavigationArgs
} from './navigation.model'
import {NavigationService} from './navigation.service'
import {BadRequestException} from '@nestjs/common'

@Resolver(() => Navigation)
export class NavigationResolver {
  constructor(private readonly navigationService: NavigationService) {}

  @Query(() => Navigation, {nullable: true})
  getNavigation(@Args() {id, key}: NavigationArgs) {
    if (id) {
      return this.navigationService.getNavigationById(id)
    }

        if (key) {
      return this.navigationService.getNavigationByKey(key)
    }

    throw new BadRequestException('Need to provide id or key')
  }

  @Query(() => [Navigation])
  @Permissions(CanGetNavigations)
  getNavigations() {
    return this.navigationService.getNavigations()
  }

  @Mutation(() => Navigation)
  @Permissions(CanCreateNavigation)
  createNavigation(@Args('input') input: CreateNavigationInput) {
    return this.navigationService.createNavigation(input)
  }

  @Mutation(() => Navigation)
  @Permissions(CanDeleteNavigation)
  deleteNavigation(@Args() {id}: NavigationIdArgs) {
    return this.navigationService.deleteNavigationById(id)
  }

  @Mutation(() => Navigation)
  @Permissions(CanCreateNavigation)
  updateNavigation(@Args('input') input: UpdateNavigationArgs) {
    return this.navigationService.updateNavigation(input)
  }
}
