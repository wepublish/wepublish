import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { PrintIssueStartService } from './print-issue-start.service';

@ObjectType({
  description: 'A printed issue as a new subscriber sees it («Abo-Start»).',
})
export class PublicPrintIssue {
  @Field()
  id!: string;

  @Field({ description: 'As the medium writes it, e.g. «6.26» or «#117».' })
  label!: string;

  @Field(() => String, { nullable: true, description: 'The topic.' })
  title!: string | null;

  @Field({ description: 'The ship day (YYYY-MM-DD).' })
  issueDate!: string;
}

@ObjectType({
  description:
    'The issues a new subscriber chooses the first one from: the last shipped and the next.',
})
export class PrintIssueStart {
  @Field(() => PublicPrintIssue, {
    description: 'Shipped today at the latest, whatever its status.',
  })
  current!: PublicPrintIssue;

  @Field(() => PublicPrintIssue, {
    nullable: true,
    description: 'Ships later; none until staff created it.',
  })
  upcoming!: PublicPrintIssue | null;
}

/**
 * Public on purpose: the subscribe form asks before anyone is signed in. It
 * lives outside the dark print-issue resolver so a medium without the print
 * export gets null instead of an error.
 */
@Resolver()
export class PrintIssueStartResolver {
  constructor(private start: PrintIssueStartService) {}

  @Public()
  @Query(() => PrintIssueStart, {
    nullable: true,
    description:
      'The issues a new subscriber chooses where the subscription starts from; null while the print export is off or nothing shipped yet.',
  })
  printIssueStart() {
    return this.start.start();
  }
}
