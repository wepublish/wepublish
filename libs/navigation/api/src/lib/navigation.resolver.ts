import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {CanCreateNavigation, CanDeleteNavigation, Permissions} from '@wepublish/permissions/api'
import {CreateNavigationInput, Navigation, UpdateNavigationInput} from './navigation.model'
import {NavigationService} from './navigation.service'
import {NavigationDataloader} from './navigation.dataloader'
import {BadRequestException} from '@nestjs/common'

@Resolver(() => Navigation)
export class NavigationResolver {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly navigationDataLoader: NavigationDataloader
  ) {}

  @Query(() => Navigation, {description: `Returns a navigation by id or key.`})
  async navigation(
    @Args('id', {nullable: true}) id?: string,
    @Args('key', {nullable: true}) key?: string
  ) {
    if (id != null) {
      return this.navigationDataLoader.load(id)
    }

    if (key != null) {
      return this.navigationService.getNavigationByKey(key)
    }

    throw new BadRequestException('id or key required.')
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
}
