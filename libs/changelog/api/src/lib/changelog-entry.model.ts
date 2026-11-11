import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { ChangelogSeverity } from '@prisma/client';
import { PaginatedType } from '@wepublish/utils/api';

export { ChangelogSeverity };

registerEnumType(ChangelogSeverity, {
  name: 'ChangelogSeverity',
  description: 'How urgently a changelog entry asks the instance to act.',
  valuesMap: {
    INFO: { description: 'Nothing to do, the entry only informs.' },
    RECOMMENDED: {
      description:
        'A manual step is asked for, but nothing breaks while it waits.',
    },
    REQUIRED: {
      description:
        'A manual step has to happen as soon as possible, something stops working or degrades until it does.',
    },
  },
});

@ObjectType()
export class ChangelogEntry {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => Date)
  releasedAt!: Date;

  @Field()
  title!: string;

  @Field()
  lead!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => ChangelogSeverity)
  severity!: ChangelogSeverity;

  @Field({
    description:
      'True for every severity that asks for an action (RECOMMENDED and REQUIRED).',
    deprecationReason: 'Use severity.',
  })
  actionRequired!: boolean;

  @Field(() => Date, { nullable: true })
  confirmedAt?: Date | null;

  @Field(() => String, { nullable: true })
  confirmedByUserId?: string | null;
}

@InputType()
export class ChangelogEntryFilter {
  @Field({
    nullable: true,
    description:
      'True for entries that ask for an action (RECOMMENDED or REQUIRED), false for INFO entries.',
  })
  actionRequired?: boolean;

  @Field(() => [ChangelogSeverity], { nullable: true })
  severities?: ChangelogSeverity[];

  @Field({ nullable: true })
  confirmed?: boolean;
}

@ObjectType()
export class PaginatedChangelogEntries extends PaginatedType(ChangelogEntry) {}

@ArgsType()
export class ChangelogEntryListArgs {
  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => ChangelogEntryFilter, {
    nullable: true,
    description: 'Filter for changelog entries',
  })
  filter?: ChangelogEntryFilter;

  @Field(() => String, {
    nullable: true,
    description:
      'Locale (de, en, fr) for localized title, lead and description; falls back to the default content',
  })
  locale?: string;
}
