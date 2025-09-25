import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  Authenticated,
  AuthSessionType,
  CurrentUser,
  Public,
  UserSession
} from '@wepublish/authentication/api'
import {UserService} from './user.service'
import {PaymentProviderCustomer, PaymentProviderCustomerInput, User, UserInput} from './user.model'
import {UserInputError} from '@nestjs/apollo'
import {UploadImageInput} from '@wepublish/image/api'
import {ProfileService} from './profile.service'

@Resolver()
export class ProfileResolver {
  constructor(
    private userService: UserService,
    private profileService: ProfileService
  ) {}

  @Public()
  @Query(() => User, {
    description: `This query returns the user.`,
    nullable: true
  })
  async me(@CurrentUser() session: UserSession): Promise<User | null> {
    if (session?.type !== AuthSessionType.User) {
      return null
    }

    return session.user
  }

  @Authenticated()
  @Mutation(() => User, {
    description: `This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.`
  })
  async updatePassword(
    @Args('password') password: string,
    @Args('passwordRepeated') passwordRepeated: string,
    @CurrentUser() {user}: UserSession
  ) {
    if (password !== passwordRepeated) {
      throw new UserInputError('password and passwordRepeat are not equal')
    }

    return this.userService.updateUserPassword(user.id, password)
  }

  @Authenticated()
  @Mutation(() => [PaymentProviderCustomer], {
    description: `This mutation allows to update the Payment Provider Customers`
  })
  async updatePaymentProviderCustomers(
    @Args('input', {type: () => [PaymentProviderCustomerInput]})
    input: PaymentProviderCustomerInput[],
    @CurrentUser() session: UserSession
  ) {
    const user = await this.profileService.updatePaymentProviderCustomers(session.user.id, input)

    if (!user) {
      throw new UserInputError(`User not found ${session.user.id}`)
    }

    return user.paymentProviderCustomers
  }

  @Authenticated()
  @Mutation(() => User, {
    nullable: true,
    description: `This mutation allows to upload and update the user's profile image.`
  })
  async uploadUserProfileImage(
    @Args('uploadImageInput', {
      type: () => UploadImageInput,
      nullable: true
    })
    uploadImageInput: UploadImageInput | null,
    @CurrentUser() session: UserSession
  ) {
    return this.profileService.uploadUserProfileImage(session.user, uploadImageInput)
  }

  @Authenticated()
  @Mutation(() => User, {
    nullable: true,
    description: `This mutation allows to update the user's data by taking an input of type UserInput.`
  })
  async updateUser(@Args('input') input: UserInput, @CurrentUser() session: UserSession) {
    return this.profileService.updatePublicUser(session.user, input)
  }
}
