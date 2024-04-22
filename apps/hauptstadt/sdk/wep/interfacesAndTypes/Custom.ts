import User from '~/sdk/wep/models/user/User'
import Address from '~/sdk/wep/models/user/Address'
import Invoices from '~/sdk/wep/models/invoice/Invoices'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'

export interface CreateSessionResponse {
  user: User
  token: string
}

export interface RegistrationFormField {
  name:
    | 'firstName'
    | 'name'
    | 'email'
    | 'emailRepeat'
    | 'streetAddress'
    | 'zipCode'
    | 'city'
    | 'country'
  label: string
  rule?: string
  required: boolean
  cssClass?: string
}

export type LoginResponseError =
  | 'wrong-query-format'
  | 'could-not-login'
  | 'user-fetch-failed'
  | 'login-with-jwt-failed'
  | 'login-with-credentials-failed'
  | 'could-not-send-login-link'
export type LoginResponseSuccess = 'login-success' | 'login-link-sent'
export type LoginResponse = LoginResponseSuccess | LoginResponseError

export type LoginMode = 'credentialsLogin' | 'mailLogin'

export interface UserMutationObject {
  name?: string
  firstName?: string
  email?: string
  address: Address | undefined
  flair?: string
}

export type SocialMediaName = 'facebook' | 'twitter' | 'whatsapp' | 'mail' | 'copy' | 'linkedin'

export interface SocialMedia {
  name: SocialMediaName
  color: string
  href: string
  icon: string
}

export interface InvoicesAndSubscriptions {
  invoices: Invoices
  subscriptions: Subscriptions
}
