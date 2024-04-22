import moment, {Moment} from 'moment'
import gql from 'graphql-tag'

export default class SubscriptionDeactivation {
  public reason: string
  public date?: Moment

  constructor({reason, date}: {reason: string; date?: Moment}) {
    this.reason = reason
    this.date = date ? moment(date) : undefined
  }

  static deactivationFragment = gql`
    fragment deactivation on SubscriptionDeactivation {
      reason
      date
    }
  `
}
