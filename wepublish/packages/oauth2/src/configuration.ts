import {interactionPolicy} from 'oidc-provider'
// copies the default policy, already has login and consent prompt policies
const {Prompt, base: policy} = interactionPolicy
const interactions = policy()

// create a requestable prompt with no implicit checks
const selectAccount = new Prompt({
  name: 'select_account',
  requestable: true
})

// add to index 0, order goes select_account > login > consent
interactions.add(selectAccount, 0)

export const configuration: object = {
  interactions: {
    policy: interactions,
    url(ctx: any, interaction: any) {
      return `/interaction/${ctx.oidc.uid}`
    }
  },
  claims: {
    address: ['address'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    profile: [
      'birthdate',
      'family_name',
      'gender',
      'given_name',
      'locale',
      'middle_name',
      'name',
      'nickname',
      'picture',
      'preferred_username',
      'profile',
      'updated_at',
      'website',
      'zoneinfo'
    ]
  },
  features: {
    devInteractions: {enabled: false}, // defaults to true

    deviceFlow: {enabled: true}, // defaults to false
    introspection: {enabled: true}, // defaults to false
    revocation: {enabled: true} // defaults to false
  },
  ttl: {
    AccessToken: 1 * 60 * 60, // 1 hour in seconds
    AuthorizationCode: 10 * 60, // 10 minutes in seconds
    IdToken: 1 * 60 * 60, // 1 hour in seconds
    DeviceCode: 10 * 60, // 10 minutes in seconds
    RefreshToken: 1 * 24 * 60 * 60 // 1 day in seconds
  }
}
