import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

export enum Weekday {
  Monday = 'MONDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY',
  Thursday = 'THURSDAY',
  Friday = 'FRIDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
}

registerEnumType(Weekday, {
  name: 'Weekday',
  description: 'A day of the week, used to time blocks.',
});

@ObjectType('BlockTimeOfDay')
@InputType('BlockTimeOfDayInput')
export class BlockTimeOfDay {
  @Field({
    description: 'Start of the daily window, as `HH:mm` in the site timezone.',
  })
  from!: string;

  @Field({
    description:
      'End of the daily window, as `HH:mm` in the site timezone. An end before the start wraps over midnight.',
  })
  to!: string;
}

@ObjectType('BlockTiming')
@InputType('BlockTimingInput')
export class BlockTiming {
  @Field(() => Date, {
    nullable: true,
    description: 'The block is hidden before this moment.',
  })
  from?: Date | null;

  @Field(() => Date, {
    nullable: true,
    description: 'The block is hidden from this moment on.',
  })
  to?: Date | null;

  @Field(() => [Weekday], {
    nullable: true,
    description:
      'The block is only displayed on these weekdays. Empty means every day.',
  })
  weekdays?: Weekday[] | null;

  @Field(() => BlockTimeOfDay, {
    nullable: true,
    description: 'The block is only displayed during this daily window.',
  })
  timeOfDay?: BlockTimeOfDay | null;
}
