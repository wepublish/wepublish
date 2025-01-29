import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {CanCreateNavigation, CanDeleteNavigation, Permissions} from '@wepublish/permissions/api'
import {
  BaseNavigationLink,
  CreateNavigationInput,
  Navigation,
  UpdateNavigationInput
} from './navigation.model'
import {NavigationService} from './navigation.service'
import {NavigationDataloaderService} from './navigation-dataloader.service'

@Resolver(() => Navigation)
export class NavigationResolver {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly navigationDataLoader: NavigationDataloaderService
  ) {}

  @Query(() => Navigation, {description: `Returns a navigation by id.`})
  navigation(@Args('id') id: string) {
    return this.navigationDataLoader.load(id)
  }

  @Query(() => [Navigation], {description: `Returns a list of navigations.`})
  navigations() {
    return this.navigationService.getNavigations()
  }

  @Mutation(() => Navigation, {description: `Creates a new navigation.`})
  @Permissions(CanCreateNavigation)
  createNavigation(@Args() navigation: CreateNavigationInput) {
    return this.navigationService.createNavigation(navigation)
  }

  @Mutation(() => Navigation, {description: `Updates an existing navigation.`})
  @Permissions(CanCreateNavigation)
  updateNavigation(@Args() navigation: UpdateNavigationInput) {
    return this.navigationService.updateNavigation(navigation)
  }

  @Mutation(() => Navigation, {description: `Deletes an existing navigation.`})
  @Permissions(CanDeleteNavigation)
  deleteNavigation(@Args('id') id: string) {
    return this.navigationService.deleteNavigationById(id)
  }

  @ResolveField(() => [BaseNavigationLink], {nullable: true})
  public links(@Parent() navigation: Navigation) {
    return this.navigationService.getNavigationLinks(navigation.id)
  }
}
