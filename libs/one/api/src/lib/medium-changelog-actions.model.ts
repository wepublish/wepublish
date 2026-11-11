import { Field, ObjectType } from '@nestjs/graphql';
import { ChangelogSeverity } from '@wepublish/changelog/api';

/**
 * One changelog entry and, where it asked the medium to do something, who
 * signed it off. Informative entries travel with the list for context but are
 * never tasks: an unconfirmed one is not an open item and never a finding.
 */
@ObjectType()
export class MediumChangelogAction {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  title!: string;

  @Field(() => ChangelogSeverity, {
    description:
      'INFO for a purely informative entry; RECOMMENDED and REQUIRED ask for an action, REQUIRED as soon as possible.',
  })
  severity!: ChangelogSeverity;

  @Field({
    description:
      'False for a purely informative entry (severity INFO), which is never counted as open or overdue.',
  })
  actionRequired!: boolean;

  @Field(() => Date)
  releasedAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Null while the action is still open.',
  })
  confirmedAt!: Date | null;

  @Field(() => String, { nullable: true })
  confirmedByName!: string | null;

  @Field(() => String, { nullable: true })
  confirmedByEmail!: string | null;
}
