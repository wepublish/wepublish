import {DollarApollo} from 'vue-apollo/types/vue-apollo'
import {Framework} from 'vuetify'

// extending vue instance with apollo (https://dev.to/carlomigueldy/getting-started-with-nuxt-composition-api-typescript-417f)
declare module 'vue/types/vue' {
  interface Vue {
    $apollo: DollarApollo<any>
    $vuetify: Framework
  }
}

declare global {
  interface Window {
    twttr?: any
    instgrm?: any
  }
}
