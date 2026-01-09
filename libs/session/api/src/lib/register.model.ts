import { Field, ObjectType } from '@nestjs/graphql';
// eslint-disable-next-line no-restricted-imports
import { SensitiveDataUser } from '@wepublish/user/api';
import { SessionWithTokenWithoutUser } from './session.model';

@ObjectType()
export class Registration {
  @Field()
  user!: SensitiveDataUser;

  @Field(() => SessionWithTokenWithoutUser)
  session!: SessionWithTokenWithoutUser;
}
