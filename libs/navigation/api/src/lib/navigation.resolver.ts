import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {CanCreateNavigation, CanDeleteNavigation, Permissions} from '@wepublish/permissions/api'
import {CreateNavigationInput, Navigation, UpdateNavigationInput} from './navigation.model'
import {NavigationService} from './navigation.service'
import {NavigationDataloader} from './navigation.dataloader'
import {NotFoundException} from '@nestjs/common'

@Resolver(() => Navigation)
export class NavigationResolver {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly navigationDataLoader: NavigationDataloader
  ) {}

  @Query(() => Navigation, {description: `Returns a navigation by key.`})
  async getNavigationByKey(@Args('key') key: string) {
    const navigation = await this.navigationService.getNavigationByKey(key)

    if (navigation === null) {
      throw new NotFoundException()
    }

    return navigation
  }

  @Query(() => Navigation, {description: `Returns a navigation by id.`})
  async getNavigationById(@Args('id') id: string) {
    const navigation = await this.navigationDataLoader.load(id)

    if (navigation === null) {
      throw new NotFoundException('Navigation not found')
    }

    return navigation
  }

  @Query(() => [Navigation], {description: `Returns a list of navigations.`})
  getNavigations() {
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
