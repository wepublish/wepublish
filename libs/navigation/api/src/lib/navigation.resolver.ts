import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {CanCreateNavigation, CanDeleteNavigation, Permissions} from '@wepublish/permissions/api'
import {
  CreateNavigationArgs,
  Navigation,
  NavigationIdArgs,
  NavigationKeyArgs,
  UpdateNavigationArgs
} from './navigation.model'
import {NavigationService} from './navigation.service'
import {UserInputError} from '@nestjs/apollo'
import {NavigationDataloader} from './navigation.dataloader'

@Resolver(() => Navigation)
export class NavigationResolver {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly navigationDataLoader: NavigationDataloader
  ) {}

  @Query(() => Navigation, {description: `Returns a navigation by key.`})
  async getNavigationByKey(@Args() {key}: NavigationKeyArgs) {
    const navigation = await this.navigationService.getNavigationByKey(key)
    if (navigation === null) {
      throw new UserInputError('Navigation not found')
    }
    return navigation
  }

  @Query(() => Navigation, {description: `Returns a navigation by id.`})
  async getNavigationById(@Args() {id}: NavigationIdArgs) {
    const navigation = await this.navigationDataLoader.load(id)
    if (navigation === null) {
      throw new UserInputError('Navigation not found')
    }
    return navigation
  }

  @Query(() => [Navigation], {description: `Returns a list of navigations.`})
  navigations() {
    return this.navigationService.getNavigations()
  }

  @Mutation(() => Navigation, {description: `Creates a new navigation.`})
  @Permissions(CanCreateNavigation)
  createNavigation(@Args() {navigation}: CreateNavigationArgs) {
    return this.navigationService.createNavigation(navigation)
  }

  @Mutation(() => Navigation, {description: `Updates an existing navigation.`})
  @Permissions(CanCreateNavigation)
  updateNavigation(@Args() {navigation}: UpdateNavigationArgs) {
    return this.navigationService.updateNavigation(navigation)
  }

  @Mutation(() => Navigation, {description: `Deletes an existing navigation.`})
  @Permissions(CanDeleteNavigation)
  deleteNavigation(@Args() {id}: NavigationIdArgs) {
    return this.navigationService.deleteNavigationById(id)
  }
}
