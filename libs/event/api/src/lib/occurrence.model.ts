import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { Event, EventFilter } from './event.model';

@ObjectType()
export class Occurrence {
  @Field()
  id!: string;

  @Field()
  dateFrom!: Date;

  @Field()
  dateTo!: Date;

  @Field(() => String, { nullable: true })
  openingTime?: string | null;

  @Field()
  eventId!: string;

  @Field(() => Event)
  event?: Event;
}

@ObjectType()
export class PaginatedOccurrences extends PaginatedType(Occurrence) {}

@ArgsType()
export class AgendaListArgs {
  @Field(() => EventFilter, { nullable: true })
  filter?: EventFilter;

  @Field(() => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}
