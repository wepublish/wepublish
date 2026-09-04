import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class ZettelkastenSearchArgs {
  @Field(() => String, {
    description:
      'FTS5 expression; words are AND, «oder» is OR, phrases in quotes.',
  })
  query!: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset?: number;
}

@ArgsType()
export class ZettelkastenArchiveArgs extends ZettelkastenSearchArgs {
  @Field(() => String, {
    nullable: true,
    defaultValue: 'beides',
    description: '"archiv", "newsletter" or "beides".',
  })
  source?: string;
}

@ArgsType()
export class ZettelkastenPageArgs {
  @Field(() => String, {
    description:
      'Page id or path, e.g. "cramer_conradin" or "themen/klybeck.md".',
  })
  page!: string;
}

@ArgsType()
export class ZettelkastenEvidenceArgs {
  @Field(() => String, {
    description:
      'A path into the raw store as it appears in a source line of the wiki.',
  })
  evidence!: string;

  @Field(() => String, {
    nullable: true,
    description: 'A phrase to verify against the evidence.',
  })
  quote?: string;
}

@ArgsType()
export class ZettelkastenDailyReportArgs {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  count?: number;
}

@ArgsType()
export class ZettelkastenAnchorsArgs {
  @Field(() => [String], {
    description:
      'Capitalised word pairs from the open article, at most twenty.',
  })
  anchors!: string[];
}
