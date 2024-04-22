import {VuexModule, Module, getter, action, mutation} from 'vuex-class-component'
import {ApolloHelpers} from '@nuxtjs/apollo'
import VueRouter, {Route} from 'vue-router'
import Vue from 'vue'
import {DollarApollo} from 'vue-apollo/types/vue-apollo'
import User from '~/sdk/wep/models/user/User'
import UserService from '~/sdk/wep/services/UserService'
import {LoginResponse} from '~/sdk/wep/interfacesAndTypes/Custom'
import InvoiceService from '~/sdk/wep/services/InvoiceService'

@Module({namespacedPath: 'auth/', target: 'nuxt'})
export class AuthStore extends VuexModule {
  @getter public me: undefined | User = undefined
  @getter public fetching: boolean = false
  @getter public authInProgress: boolean = false

  get loggedIn(): boolean {
    return !!this.me
  }

  get hasAccess(): boolean {
    return this.loggedIn && !!this.me?.hasValidSubscription()
  }

  @mutation
  public setMe(me: undefined | User) {
    this.me = me
  }

  @mutation fetchStart() {
    this.fetching = true
  }

  @mutation fetchStop() {
    this.fetching = false
  }

  @mutation authProgressStart() {
    this.authInProgress = true
  }

  @mutation authProgressStop() {
    this.authInProgress = false
  }

  @mutation
  setMePartially({
    name,
    firstName,
    preferredName,
    streetAddress,
    zipCode,
    city,
    country,
    flair
  }: {
    name?: string
    firstName?: string
    preferredName?: string
    streetAddress?: string
    zipCode?: string
    city?: string
    country?: string
    flair?: string
  }): void {
    if (!this.me?.address) {
      return
    }
    if (name) {
      this.me.name = name
    }
    if (firstName) {
      this.me.firstName = firstName
    }
    if (preferredName) {
      this.me.preferredName = preferredName
    }
    if (streetAddress) {
      this.me.address.streetAddress = streetAddress
    }
    if (zipCode) {
      this.me.address.zipCode = zipCode
    }
    if (city) {
      this.me.address.city = city
    }
    if (country) {
      this.me.address.country = country
    }
    if (flair) {
      this.me.flair = flair
    }
  }

  @action
  public async login({
    vue,
    $apollo,
    $apolloHelpers,
    $route,
    email,
    password
  }: {
    vue: Vue
    $apollo: DollarApollo<any>
    $apolloHelpers?: ApolloHelpers
    $route: Route
    email?: string
    password?: string
  }): Promise<LoginResponse> {
    this.$store.commit('auth/authProgressStart')
    // pre-tests
    const querySession = $route?.query?.session
    const jwt = $route?.query?.jwt
    if ((jwt && typeof jwt !== 'string') || (querySession && typeof querySession !== 'string')) {
      this.$store.commit('auth/authProgressStop')
      return 'wrong-query-format'
    }

    // 1. get and set jwt token from url query
    if (jwt && $apolloHelpers) {
      return await this.$store.dispatch('auth/createSessionWithJWT', {
        vue,
        $apollo,
        $apolloHelpers,
        jwt
      })
    }
    // 2. try to log in with local stored session key
    const localStoredSession = $apolloHelpers?.getToken()
    if (localStoredSession && $apolloHelpers) {
      return await this.$store.dispatch('auth/getAndSetMe', {vue})
    }
    // 3. get and set session token out of query var or from local storage
    if (querySession && $apolloHelpers) {
      return await this.$store.dispatch('auth/loginWithSession', {
        vue,
        $apollo,
        $apolloHelpers,
        session: querySession
      })
    }
    // 4. try to log in with credentials
    if (email && password && $apolloHelpers) {
      return await this.$store.dispatch('auth/createSession', {
        vue,
        $apolloHelpers,
        email,
        password
      })
    }
    // 5. try to send an email with login link
    if (email) {
      return await this.$store.dispatch('auth/sendWebsiteLogin', {vue, email})
    }
    // 6. In case of a service error return false
    this.$store.commit('auth/authProgressStop')
    return 'could-not-login'
  }

  @action
  async getAndSetMe({vue}: {vue: Vue}): Promise<LoginResponse> {
    const me = await new UserService({vue}).getMe({maxRetryAttempts: 4})
    if (me) {
      await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', {vue, me})
      this.$store.commit('auth/authProgressStop')
      return 'login-success'
    }
    // vue.$sentry?.captureMessage(`Log-out because of invalid token ${$apolloHelpers.getToken()}`)
    // in case of user fetching failed (because of invalid token), delete the token
    // await $apolloHelpers.onLogout()
    this.$store.commit('auth/authProgressStop')
    return 'user-fetch-failed'
  }

  @action
  async loginWithSession({
    vue,
    $apollo,
    $apolloHelpers,
    session
  }: {
    vue: Vue
    $apollo: DollarApollo<any>
    $apolloHelpers: ApolloHelpers
    session: string
  }): Promise<LoginResponse> {
    // https://github.com/apollographql/apollo-client/issues/3766#issuecomment-578075556
    $apollo.getClient().stop()
    await $apolloHelpers.onLogin(`${session}`, undefined, {
      expires: 365,
      path: '/',
      secure: true,
      sameSite: 'lax'
    })
    // in case of valid token, simply retrieve user from wep
    const response = await this.$store.dispatch('auth/getAndSetMe', {vue})
    this.$store.commit('auth/authProgressStop')
    return response
  }

  @action
  async createSessionWithJWT({
    vue,
    $apollo,
    $apolloHelpers,
    jwt
  }: {
    vue: Vue
    $apollo: DollarApollo<any>
    $apolloHelpers: ApolloHelpers
    jwt: string
  }): Promise<LoginResponse> {
    const response = await new UserService({vue}).createSessionWithJWT({jwt})
    if (!response) {
      this.$store.commit('auth/authProgressStop')
      return 'login-with-jwt-failed'
    }
    // https://github.com/apollographql/apollo-client/issues/3766#issuecomment-578075556
    $apollo.getClient().stop()
    await $apolloHelpers.onLogin(response.token, undefined, {
      expires: 365,
      path: '/',
      secure: true,
      sameSite: 'lax'
    })
    await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', {vue, me: response.user})
    this.$store.commit('auth/authProgressStop')
    return 'login-success'
  }

  @action
  async createSession({
    vue,
    $apolloHelpers,
    email,
    password
  }: {
    vue: Vue
    $apolloHelpers: ApolloHelpers
    email: string
    password: string
  }): Promise<LoginResponse> {
    const response = await new UserService({vue}).createSession({
      email,
      password
    })
    if (!response) {
      this.$store.commit('auth/authProgressStop')
      return 'login-with-credentials-failed'
    }
    await $apolloHelpers.onLogin(response.token, undefined, {
      expires: 365,
      path: '/',
      secure: true,
      sameSite: 'lax'
    })
    await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', {vue, me: response.user})
    this.$store.commit('auth/authProgressStop')
    return 'login-success'
  }

  @action
  async sendWebsiteLogin({vue, email}: {vue: Vue; email: string}): Promise<LoginResponse> {
    const response = await new UserService({vue}).sendWebsiteLogin({email})
    if (!response) {
      this.$store.commit('auth/authProgressStop')
      return 'could-not-send-login-link'
    }
    this.$store.commit('auth/authProgressStop')
    return 'login-link-sent'
  }

  @action
  async logout({$apolloHelpers, $router}: {$apolloHelpers: ApolloHelpers; $router: VueRouter}) {
    await $apolloHelpers.onLogout()
    const routeQuery = $router?.currentRoute?.query
    if (routeQuery?.session || routeQuery?.jwt) {
      await $router.replace({query: undefined})
    }
    this.$store.commit('auth/setMe', undefined)
    await $router.push('/')
  }

  /**
   * Simplify it when https://wepublish.atlassian.net/browse/WPC-799 is done
   * @param vue
   * @param me
   */
  @action
  async setMeAndFetchAdditionalUserData({
    vue,
    me,
    lazyLoad
  }: {
    vue: Vue
    me: undefined | User
    lazyLoad: undefined | boolean
  }) {
    // avoid mutate an object outside the vuex store
    if (!me) {
      me = this.me?.clone()
    }
    if (!me) {
      this.$store.commit('auth/setMe', me)
      return
    }
    this.$store.commit('auth/fetchStart')
    // only refresh user data, if data is older than 10 seconds. Avoid calling this endpoint multiple times from different vue components
    if ((lazyLoad && me.clientObjectIsOlderThan(10)) || !lazyLoad) {
      me = await this.$store.dispatch('auth/fetchAdditionalUserData', {vue, me})
    }
    this.$store.commit('auth/setMe', me)
    this.$store.commit('auth/fetchStop')
  }

  @action
  async fetchAdditionalUserData({vue, me}: {vue: Vue; me: User}): Promise<User> {
    // fetch additional user data which are invoices and subscriptions
    const additionalUserData = await new UserService({vue}).getAdditionalUserData()
    if (additionalUserData) {
      me.subscriptions = additionalUserData.subscriptions
      me.invoices = additionalUserData.invoices
    }

    // check unpaid invoices and refresh subscriptions
    if (me.invoices && me.subscriptions) {
      const invoiceService = new InvoiceService({vue})
      const updatedUserData = await invoiceService.checkUnpaidInvoices({
        invoices: me.invoices,
        subscriptions: me.subscriptions
      })
      me.invoices = updatedUserData.invoices
      me.subscriptions = updatedUserData.subscriptions
    }
    return me
  }
}
