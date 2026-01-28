import { ArgsType, Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserEvent } from '@prisma/client';
import { MailTemplateRef } from '../subscription-flow/subscription-flow.model';

registerEnumType(UserEvent, {
  name: 'UserEvent',
});

@ObjectType()
export class SystemMailModel {
  @Field(() => UserEvent)
  event!: UserEvent;

  @Field(() => MailTemplateRef, { nullable: true })
  mailTemplate!: MailTemplateRef | null;
}

@ArgsType()
export class SystemMailUpdateInput {
  @Field(() => UserEvent)
  event!: UserEvent;

  @Field()
  mailTemplateId!: string;
}
