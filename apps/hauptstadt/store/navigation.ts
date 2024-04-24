import {VuexModule, Module, getter, mutation, action} from 'vuex-class-component'
import Vue from 'vue'
import Navigations from '~/sdk/wep/models/navigation/Navigations'
import NavigationService from '~/sdk/wep/services/NavigationService'

@Module({namespacedPath: 'navigation/', target: 'nuxt'})
export class NavigationStore extends VuexModule {
  @getter MENU_NAVIGATION_KEYS: string[] = [
    'menu-rubrics',
    'menu-pages',
    'footer-social-media',
    'menu-button'
  ]
  @getter menuNavigations: Navigations | null = null
  @getter menuOpen: Boolean = false
  @getter denseHeader: Boolean = false

  @action
  public async lazyLoadMenuNavigations({vue}: {vue: Vue}): Promise<void> {
    // only load navigations if not yet
    if (this.menuNavigations) {
      return
    }
    const navigationService = new NavigationService({
      vue
    })
    // fetch data
    const navigations: Navigations = await navigationService.getNavigations(
      this.MENU_NAVIGATION_KEYS
    )
    this.setMenuNavigations(navigations)
  }

  @mutation
  public setMenuNavigations(navigations: Navigations) {
    this.menuNavigations = navigations
  }

  @mutation
  public toggleMenu() {
    this.menuOpen = !this.menuOpen
  }

  @mutation
  public closeMenu() {
    this.menuOpen = false
  }

  @mutation
  public setDenseHeader(denseHeader: Boolean) {
    this.denseHeader = denseHeader
  }
}

export default NavigationStore.ExtractVuexModule(NavigationStore)
