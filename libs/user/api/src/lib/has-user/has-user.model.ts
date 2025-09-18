import { Field, InterfaceType } from '@nestjs/graphql';
import { User } from '../user.model';

@InterfaceType()
export abstract class HasOptionalUser {
  @Field({ nullable: true })
  userID?: string;

  @Field(() => User, { nullable: true })
  user?: User;
}

@InterfaceType()
export abstract class HasUser {
  @Field()
  userID!: string;

  @Field(() => User)
  user!: User;
}

// New Style

@InterfaceType()
export abstract class HasUserLc {
  @Field()
  userId!: string;

  @Field(() => User)
  user!: User;
}

@InterfaceType()
export abstract class HasOptionalUserLc {
  @Field({ nullable: true })
  userId?: string;

  @Field(() => User, { nullable: true })
  user?: User;
}
