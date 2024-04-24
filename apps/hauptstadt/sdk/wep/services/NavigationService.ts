import {gql} from 'graphql-tag'
import Vue from 'vue'
import Service from '~/sdk/wep/services/Service'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import Navigations from '~/sdk/wep/models/navigation/Navigations'

export default class NavigationService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Retrieve multiple navigations
   * @param keys
   */
  async getNavigations(keys: string[]): Promise<Navigations> {
    if (!keys || !keys.length) {
      throw new Error(
        'Parameter keys not provided in method getNavigations() within NavigationService class.'
      )
    }
    const navigations = new Navigations()
    const promisesToWait = keys.map(async (key: string) => await this.getNavigation({key}))
    const responses = await Promise.all(promisesToWait)
    // adding all responses to the navigations instance, if not false
    responses.forEach((navigation: Navigation | false) => {
      if (navigation) {
        navigations.navigations.push(navigation)
      }
    })
    return navigations
  }

  /**
   * Fetch a navigation by id or key
   * @param id
   * @param key
   */
  async getNavigation({id, key}: {id?: number; key?: string}): Promise<Navigation | false> {
    if (!id && !key) {
      throw new Error(
        'Parameter id or key has to be provided in function getNavigation() within NavigationService class.'
      )
    }
    try {
      const query = gql`
        query getNavigation($key: ID, $navigationId: ID) {
          navigation(key: $key, id: $navigationId) {
            ...navigation
          }
        }
        ${Navigation.navigationFragment}
      `
      const response = await this.$apollo.query({
        query,
        variables: {
          id,
          key
        },
        errorPolicy: 'all'
      })
      return new Navigation(response?.data?.navigation)
    } catch (e) {
      this.alert({
        title: 'Navigation konnte nicht abgerufen werden.',
        type: 'error'
      })
      return false
    }
  }
}
