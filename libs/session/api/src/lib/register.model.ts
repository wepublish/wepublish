import { Field, ObjectType } from '@nestjs/graphql';
import { SensitiveDataUser } from '@wepublish/user/api';
import { SessionWithTokenWithoutUser } from './session.model';

@ObjectType()
export class Registration {
  @Field()
  user!: SensitiveDataUser;

  @Field(() => SessionWithTokenWithoutUser)
  session!: SessionWithTokenWithoutUser;
}
