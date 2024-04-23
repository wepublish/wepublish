import {gql} from 'graphql-tag'

export type PropertyKey =
  | 'type'
  | 'rubric'
  | 'crowdfunding-block-position'
  | 'crowdfunding-directus-id'
  | 'member-plan-tag'
export type PropertyValue =
  | 'opinion'
  | 'login'
  | 'profile'
  | 'archive'
  | 'front'
  | 'deactivated-abos'
  | 'create-member-plan'
  | 'abo-details'
  | 'open-invoice'
  | 'crowdfunding'
  | 'trial-subscription'
  | 'normal-subscription'

export default class Property {
  public key: PropertyKey
  public value: PropertyValue

  constructor({key, value}: {key: PropertyKey; value: PropertyValue}) {
    this.key = key
    this.value = value
  }

  public static propertyFragment = gql`
    fragment property on PublicProperties {
      key
      value
    }
  `
}
