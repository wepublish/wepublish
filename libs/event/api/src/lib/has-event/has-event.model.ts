import { Field, InterfaceType } from '@nestjs/graphql';
import { Event } from '../event.model';

@InterfaceType()
export abstract class HasOptionalEvent {
  @Field({ nullable: true })
  eventID?: string;

  @Field(() => Event, { nullable: true })
  event?: Event;
}

@InterfaceType()
export abstract class HasEvent {
  @Field()
  eventID!: string;

  @Field(() => Event)
  event!: Event;
}

// New Style

@InterfaceType()
export abstract class HasEventLc {
  @Field()
  eventId!: string;

  @Field(() => Event)
  event!: Event;
}

@InterfaceType()
export abstract class HasOptionalEventLc {
  @Field({ nullable: true })
  eventId?: string;

  @Field(() => Event, { nullable: true })
  event?: Event;
}
