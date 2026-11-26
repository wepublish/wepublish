import { registerEnumType } from '@nestjs/graphql';

export enum SubscribeBlockField {
  FirstName = 'firstName',
  Address = 'address',
  Birthday = 'birthday',
  EmailRepeated = 'emailRepeated',
  Password = 'password',
  PasswordRepeated = 'passwordRepeated',
}

registerEnumType(SubscribeBlockField, {
  name: 'SubscribeBlockField',
});
