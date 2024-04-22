import {VuexModule, Module, getter, action, mutation} from 'vuex-class-component'
import {Directus} from '@directus/sdk'
import {NuxtConfig} from '@nuxt/types'
import Paywall, {PaywallType} from '~/sdk/wep-cms/models/paywall/Paywall'
import Paywalls from '~/sdk/wep-cms/models/paywall/Paywalls'

@Module({namespacedPath: 'paywall/', target: 'nuxt'})
export class PaywallStore extends VuexModule {
  @getter public headerPaywalls: undefined | Paywalls = undefined
  @getter public articlePaywalls: undefined | Paywalls = undefined
  @getter public articleEndPaywalls: undefined | Paywalls = undefined

  @mutation
  public setPaywalls(paywalls: Paywalls) {
    this.headerPaywalls = paywalls.filterByPosition('header')
    this.articlePaywalls = paywalls.filterByPosition('articlePaywall')
    this.articleEndPaywalls = paywalls.filterByPosition('articleEnd')
  }

  /**
   * Do not mutate directly workaround
   * @param paywalls
   */
  @mutation public minimize(paywalls: Paywalls) {
    paywalls.minimize()
  }

  /**
   * Do not mutate directly workaround
   * @param paywalls
   */
  @mutation public getNext(paywalls: Paywalls) {
    paywalls?.getNext()
  }

  @action public async initPaywalls({$config}: {$config: NuxtConfig}) {
    try {
      const directus = new Directus<PaywallType>($config.WEP_CMS_URL)
      const response = await directus.items('paywall').readByQuery()
      if (response.data?.length) {
        const paywalls = new Paywalls().parse({paywalls: response.data as Paywall[]})
        this.$store.commit('paywall/setPaywalls', paywalls)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    }
  }
}

export default PaywallStore.ExtractVuexModule(PaywallStore)
