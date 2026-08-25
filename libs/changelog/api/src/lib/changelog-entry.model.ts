import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '@wepublish/utils/api';

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

  @Field()
  actionRequired!: boolean;

  @Field(() => Date, { nullable: true })
  confirmedAt?: Date | null;

  @Field(() => String, { nullable: true })
  confirmedByUserId?: string | null;
}

@InputType()
export class ChangelogEntryFilter {
  @Field({ nullable: true })
  actionRequired?: boolean;

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
