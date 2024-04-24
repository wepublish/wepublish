import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'
import User from '~/sdk/wep/models/user/User'
import {
  CreateSessionResponse,
  InvoicesAndSubscriptions,
  UserMutationObject
} from '~/sdk/wep/interfacesAndTypes/Custom'
import Password from '~/sdk/wep/classes/Password'
import {UploadImageInput} from '~/sdk/wep/models/image/WepImage'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import Invoice from '~/sdk/wep/models/invoice/Invoice'
import Invoices from '~/sdk/wep/models/invoice/Invoices'

export default class UserService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  public async updateUser({
    user,
    uploadImageInput
  }: {
    user: UserMutationObject
    uploadImageInput?: UploadImageInput
  }): Promise<User | false> {
    if (!user) {
      throw new Error('user instance missing in updateUser() method within UserService class!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($input: UserInput!) {
          updateUser(input: $input) {
            ...user
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          input: {
            ...user,
            uploadImageInput
          }
        }
      })
      const returnUser = new User(response?.data?.updateUser)
      this.alert({
        title: 'Persönliche Daten erfolgreich aktualisiert.',
        type: 'success'
      })
      this.loadingFinish()
      return returnUser
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Benutzerdaten konnten nicht aktualisiert werden.',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Upload and save the user profile picture
   * @param uploadImageInput
   */
  public async uploadUserProfileImage({
    uploadImageInput
  }: {
    uploadImageInput: UploadImageInput | null
  }): Promise<User | false> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($uploadImageInput: UploadImageInput) {
          uploadUserProfileImage(uploadImageInput: $uploadImageInput) {
            ...user
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          uploadImageInput
        }
      })
      const returnUser = new User(response?.data?.uploadUserProfileImage)
      this.alert({
        title: 'Profilbild erfolgreich gespeichert',
        type: 'success'
      })
      this.loadingFinish()
      return returnUser
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: e as string,
        type: 'error'
      })
      return false
    }
  }

  /**
   * Update the user's password.
   * @param password
   */
  public async updatePassword({password}: {password: Password}): Promise<User | false> {
    if (!password) {
      throw new Error(
        'password instance missing in updatePassword() method within UserService class!'
      )
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($password: String!, $passwordRepeated: String!) {
          updatePassword(password: $password, passwordRepeated: $passwordRepeated) {
            ...user
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          ...password
        }
      })
      const user = new User(response?.data?.updatePassword)
      this.alert({
        title: 'Passwort erfolgreich geändert.',
        type: 'success'
      })
      this.loadingFinish()
      return user
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Passwort konnte nicht geändert werden',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Retrieve auth token from wepublish by providing mail and password
   * @param email
   * @param password
   * @return {Promise<boolean|{user: User, token: *}>}
   */
  public async createSession({
    email,
    password
  }: {
    email: string
    password: string
  }): Promise<CreateSessionResponse | false> {
    if (!email) {
      throw new Error('email not provided in createSession() method within UserService class!')
    }
    if (!password) {
      throw new Error('password not provided in createSession() method within UserService class!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($email: String!, $password: String!) {
          createSession(email: $email, password: $password) {
            token
            user {
              ...user
            }
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          email,
          password
        }
      })
      const rawData = response?.data?.createSession
      this.loadingFinish()
      return {
        user: new User(rawData.user),
        token: rawData.token
      }
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Fehler beim Login. Prüfe deine Eingabe.',
        type: 'error'
      })
      return false
    }
  }

  public async createSessionWithJWT({jwt}: {jwt: string}): Promise<CreateSessionResponse | false> {
    if (!jwt) {
      throw new Error('jwt missing in createSessionWithJWT() function within UserService class!')
    }
    try {
      const mutation = gql`
        mutation Mutation($jwt: String!) {
          createSessionWithJWT(jwt: $jwt) {
            token
            user {
              ...user
            }
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          jwt
        }
      })
      const data = response?.data?.createSessionWithJWT
      return {
        user: new User(data?.user),
        token: data?.token
      }
    } catch (e) {
      this.$nuxt.$emit('alert', {
        title: 'Login mit JWT-Token fehlgeschlagen.',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Send mail to user with login link
   * @param email
   * @return {Promise<boolean>}
   */
  public async sendWebsiteLogin({email}: {email: string}): Promise<boolean> {
    if (!email) {
      throw new Error('email missing in sendWebsiteLogin() function within UserService class!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($email: String!) {
          sendWebsiteLogin(email: $email)
        }
      `
      await this.$apollo.mutate({
        mutation,
        variables: {
          email
        }
      })
      this.loadingFinish()
      return true
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'E-Mail mit Login-Link konnte nicht versendet werden.',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Fetch user form wep
   * @param apollo
   * @return {Promise<boolean|User>}
   */
  public async getMe({
    maxRetryAttempts,
    currentRetryAttempt
  }: {
    maxRetryAttempts?: number
    currentRetryAttempt?: number
  }): Promise<User | false> {
    try {
      const query = gql`
        query Query {
          me {
            ...user
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.query({
        query,
        fetchPolicy: 'no-cache'
      })
      return new User(response.data.me)
    } catch (error) {
      if (this.vue.$sentry) {
        const sentryError = new Error(
          `Could not fetch user data with token-id ${this.vue.$apolloHelpers.getToken()} in attempt ${
            currentRetryAttempt || 0
          }. Original error: ${error}`
        )
        this.vue.$sentry.captureException(sentryError)
      }
      // eventually re-try to login automatically
      if (maxRetryAttempts && (currentRetryAttempt || 0) < maxRetryAttempts) {
        currentRetryAttempt = !currentRetryAttempt ? 1 : currentRetryAttempt + 1
        await this.sleep(2000 * currentRetryAttempt)
        return await this.getMe({maxRetryAttempts, currentRetryAttempt})
      } else {
        this.alert({
          title: 'Benutzer konnte nicht abgerufen werden.',
          type: 'error'
        })
        return false
      }
    }
  }

  /**
   * Helper method to synchronously await
   * @param ms
   */
  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Fetch additional user data such as subscriptions and invoices
   */
  async getAdditionalUserData(): Promise<InvoicesAndSubscriptions | false> {
    try {
      const query = gql`
        query getAdditionalUserData {
          subscriptions {
            ...subscription
          }
          invoices {
            ...invoice
            total
          }
        }
        ${Subscription.subscriptionFragment}
        ${Invoice.invoiceFragment}
      `
      const response = await this.$apollo.query({
        query,
        fetchPolicy: 'no-cache'
      })
      return {
        subscriptions: new Subscriptions().parse(response.data.subscriptions),
        invoices: new Invoices().parseApiData(response.data.invoices)
      }
    } catch (error) {
      this.$nuxt.$emit('alert', {
        title: 'Abos konnten nicht abgerufen werden.',
        type: 'error'
      })
      return false
    }
  }
}
