import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum NotificationSource {
  CHANGELOG = 'CHANGELOG',
  ONE_MESSAGE = 'ONE_MESSAGE',
  PERIODIC_JOB = 'PERIODIC_JOB',
}

registerEnumType(NotificationSource, {
  name: 'NotificationSource',
});

@ObjectType()
export class NotificationRead {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => NotificationSource)
  source!: NotificationSource;

  @Field()
  itemId!: string;
}
