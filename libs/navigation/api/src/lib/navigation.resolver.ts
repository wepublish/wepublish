import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {CanCreateNavigation, CanDeleteNavigation, Permissions} from '@wepublish/permissions/api'
import {
  CreateNavigationInput,
  Navigation,
  NavigationArgs,
  NavigationIdArgs,
  UpdateNavigationArgs
} from './navigation.model'
import {NavigationService} from './navigation.service'
import {BadRequestException, NotFoundException} from '@nestjs/common'

@Resolver(() => Navigation)
export class NavigationResolver {
  constructor(private readonly navigationService: NavigationService) {}

  @Query(() => Navigation, {nullable: true, description: `Returns a navigation by id or key.`})
  async getNavigation(@Args() {id, key}: NavigationArgs) {
    let navigation: Navigation | null = null
    if (id) {
      navigation = await this.navigationService.getNavigationById(id)
      if (navigation === null) {
        throw new NotFoundException('Navigation not found')
      }
      return navigation
    }
    if (key) {
      navigation = await this.navigationService.getNavigationByKey(key)
      if (navigation === null) {
        throw new NotFoundException('Navigation not found')
      }
      return navigation
    }

    throw new BadRequestException('Need to provide id or key')
  }

  @Query(() => [Navigation], {description: `Returns a list of navigations.`})
  getNavigations() {
    return this.navigationService.getNavigations()
  }

  @Mutation(() => Navigation, {description: `Creates a new navigation.`})
  @Permissions(CanCreateNavigation)
  createNavigation(@Args() input: CreateNavigationInput) {
    return this.navigationService.createNavigation(input)
  }

  @Mutation(() => Navigation, {description: `Updates an existing navigation.`})
  @Permissions(CanCreateNavigation)
  updateNavigation(@Args() input: UpdateNavigationArgs) {
    return this.navigationService.updateNavigation(input)
  }

  @Mutation(() => Navigation, {description: `Deletes an existing navigation.`})
  @Permissions(CanDeleteNavigation)
  deleteNavigation(@Args() {id}: NavigationIdArgs) {
    return this.navigationService.deleteNavigationById(id)
  }
}
