import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { HasImage, Image } from '@wepublish/image/api';

@ObjectType({
  implements: () => [HasImage],
})
export class SettingSyncProviderNewsletter implements HasImage {
  @Field()
  id!: string;

  @Field()
  interestId!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  imageID?: string;
  image?: Image;
}

@ObjectType({
  implements: () => [HasImage],
})
export class UserNewsletter implements HasImage {
  @Field()
  interestId!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  subscribed!: boolean;

  imageID?: string;
  image?: Image;
}

@ObjectType()
export class UserNewsletterGroup {
  @Field()
  syncProviderId!: string;

  @Field(() => [UserNewsletter])
  newsletters!: UserNewsletter[];
}

@InputType()
export class UserNewsletterSubscriptionInput {
  @Field()
  interestId!: string;

  @Field()
  subscribed!: boolean;
}

@InputType()
export class UpdateUserNewslettersInput {
  @Field()
  syncProviderId!: string;

  @Field(() => [UserNewsletterSubscriptionInput])
  newsletters!: UserNewsletterSubscriptionInput[];
}
