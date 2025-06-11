import {Args, Mutation, Resolver} from '@nestjs/graphql'
import {Authenticated, CurrentUser, UserSession} from '@wepublish/authentication/api'
import {PublicSubscription} from '@wepublish/membership/api'
import {UserService} from './user.service'
import {PaymentProviderCustomer, PaymentProviderCustomerInput} from './user.model'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => PublicSubscription)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Authenticated()
  @Mutation(() => [PaymentProviderCustomer], {
    description: `This mutation allows to update the Payment Provider Customers`
  })
  async updatePaymentProviderCustomers(
    @Args('input', {type: () => [PaymentProviderCustomerInput]})
    input: PaymentProviderCustomerInput[],
    @CurrentUser() session: UserSession
  ) {
    const user = await this.userService.updatePaymentProviderCustomers(session.user.id, input)

    if (!user) {
      throw new UserInputError(`User not found ${session.user.id}`)
    }
    return user.paymentProviderCustomers
  }
}
