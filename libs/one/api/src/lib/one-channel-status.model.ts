import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum OneChannelConnectionState {
  NotConfigured = 'NotConfigured',
  Connected = 'Connected',
  Failing = 'Failing',
}

registerEnumType(OneChannelConnectionState, {
  name: 'OneChannelConnectionState',
});

@ObjectType()
export class OneChannelStatus {
  @Field(() => OneChannelConnectionState)
  state!: OneChannelConnectionState;

  @Field(() => String, { nullable: true })
  oneUrl!: string | null;

  @Field(() => Date, { nullable: true })
  lastSuccessAt!: Date | null;

  @Field(() => Date, { nullable: true })
  lastAttemptAt!: Date | null;

  @Field(() => String, { nullable: true })
  lastError!: string | null;
}
