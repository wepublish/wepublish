import {action, getter, Module, mutation, VuexModule} from 'vuex-class-component'
import Vue from 'vue'

@Module({namespacedPath: 'textZoom/', target: 'nuxt'})
export class TextZoomStore extends VuexModule {
  COOKIE_NAME: string = 'textZoomLevel'
  DEFAULT_ZOOM_LEVEL: number = 5
  @getter zoomLevel: number = this.DEFAULT_ZOOM_LEVEL
  @getter zoomFactor: number = 1.1
  @getter initialized: boolean = false

  @action
  public async init({vue}: {vue: Vue}): Promise<void> {
    // ignore server-side
    if (typeof document === 'undefined') {
      return
    }
    // read zoom level from cookies
    const zoomLevelCookie = await vue.$nuxt.$cookies.get(this.COOKIE_NAME)
    const newZoomLevel = parseInt(zoomLevelCookie)
    if (newZoomLevel) {
      this.$store.commit('textZoom/setZoomLevel', {zoomLevel: newZoomLevel, vue})
      this.$store.commit('textZoom/setInitialized')
    }
  }

  @action
  public async resetZoom({vue}: {vue: Vue}): Promise<void> {
    await this.$store.dispatch('textZoom/updateZoom', {newZoomLevel: this.DEFAULT_ZOOM_LEVEL, vue})
  }

  @action
  public async updateZoom({
    newZoomLevel,
    vue
  }: {
    newZoomLevel: number | undefined
    vue: Vue
  }): Promise<void> {
    // ignore server-side
    if (typeof document === 'undefined') {
      return
    }
    let zoomDiff = 0

    // eventually initialize zoom from cookies
    if (!this.initialized) {
      await this.$store.dispatch('textZoom/init', {vue})
    }

    if (newZoomLevel !== undefined) {
      zoomDiff = this.zoomLevel - newZoomLevel
    } else {
      // if new zoom level is undefined. see index.vue or WepPublication.vue for an example.
      zoomDiff = this.DEFAULT_ZOOM_LEVEL - this.zoomLevel
      newZoomLevel = this.DEFAULT_ZOOM_LEVEL - zoomDiff
    }

    // nothing to change
    if (zoomDiff === 0) {
      return
    }

    // update font size of all html elements with class "font-size"
    const elements = document.querySelectorAll('.zoomable-text')
    elements.forEach(element => {
      const textEl = element as HTMLElement
      const currentFontSize = parseFloat(window.getComputedStyle(textEl).fontSize)
      let newFontSize = currentFontSize * this.zoomFactor
      // zoom in
      if (zoomDiff < 0) {
        newFontSize = currentFontSize * Math.pow(this.zoomFactor, zoomDiff * -1)
      } else {
        // zoom out
        newFontSize = currentFontSize / Math.pow(this.zoomFactor, zoomDiff)
      }
      // update html element
      textEl.setAttribute('style', `font-size: ${newFontSize}px !important`)
    })

    // save current zoom level
    this.$store.commit('textZoom/setZoomLevel', {zoomLevel: newZoomLevel, vue})
  }

  @mutation
  public setZoomLevel({zoomLevel, vue}: {zoomLevel: number; vue: Vue}) {
    this.zoomLevel = zoomLevel
    vue.$nuxt.$cookies.set(this.COOKIE_NAME, zoomLevel)
  }

  @mutation
  public setInitialized() {
    this.initialized = true
  }
}

export default TextZoomStore.ExtractVuexModule(TextZoomStore)
