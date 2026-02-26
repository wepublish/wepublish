import { Field, InterfaceType } from '@nestjs/graphql';
import { SensitiveDataUser } from '../user.model';

@InterfaceType()
export abstract class HasOptionalSensitiveDataUser {
  @Field({ nullable: true })
  userID?: string;

  @Field(() => SensitiveDataUser, { nullable: true })
  user?: SensitiveDataUser;
}

@InterfaceType()
export abstract class HasSensitiveDataUser {
  @Field()
  userID!: string;

  @Field(() => SensitiveDataUser)
  user!: SensitiveDataUser;
}

// New Style

@InterfaceType()
export abstract class HasSensitiveDataUserLc {
  @Field()
  userId!: string;

  @Field(() => SensitiveDataUser)
  user!: SensitiveDataUser;
}

@InterfaceType()
export abstract class HasOptionalSensitiveDataUserLc {
  @Field({ nullable: true })
  userId?: string;

  @Field(() => SensitiveDataUser, { nullable: true })
  user?: SensitiveDataUser;
}
