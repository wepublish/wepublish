import {gql} from 'graphql-tag'

export default class PaymentProviderCustomer {
  public static paymentProviderCustomerFragment = gql`
    fragment paymentProviderCustomer on PaymentProviderCustomer {
      paymentProviderID
      customerID
    }
  `
}
