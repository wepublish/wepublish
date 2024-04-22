import Vue from 'vue'
import {DollarApollo} from 'vue-apollo/types/vue-apollo'
import {NuxtApp} from '@nuxt/types/app'
import IAlert from '~/sdk/wep/models/alert/IAlert'

export default class Service {
  public vue: Vue
  public $nuxt: NuxtApp
  public $apollo: DollarApollo<any>

  constructor({vue}: {vue: Vue}) {
    if (!vue) {
      throw new Error('vue instance missing!')
    }
    if (!vue.$nuxt) {
      throw new Error('nuxt instance not provided in the vue instance!')
    }
    if (!vue.$apollo) {
      throw new Error('apollo instance not provided in the vue instance!')
    }
    this.vue = vue
    this.$nuxt = vue.$nuxt
    this.$apollo = vue.$apollo
  }

  loadingStart(): void {
    this.$nuxt.$loading?.start()
  }

  loadingFinish(): void {
    this.$nuxt.$loading?.finish()
  }

  alert(alert: IAlert) {
    this.$nuxt.$emit('alert', alert)
  }
}
