import { Field, ObjectType } from '@nestjs/graphql';
import { NotificationSource } from './notification-read.model';

@ObjectType()
export class NotificationConfirmation {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => NotificationSource)
  source!: NotificationSource;

  @Field()
  itemId!: string;

  @Field(() => String, { nullable: true })
  confirmedByUserId?: string | null;
}
