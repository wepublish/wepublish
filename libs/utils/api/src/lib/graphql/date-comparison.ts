import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

export enum DateFilterComparison {
  GreaterThan = 'GreaterThan',
  GreaterThanOrEqual = 'GreaterThanOrEqual',
  Equal = 'Equal',
  LowerThan = 'LowerThan',
  LowerThanOrEqual = 'LowerThanOrEqual',
}

registerEnumType(DateFilterComparison, {
  name: 'DateFilterComparison',
});

@InputType()
export class DateFilter {
  @Field({ nullable: true })
  date?: Date;
  @Field(() => DateFilterComparison)
  comparison!: DateFilterComparison;
}

export const mapDateFilterToPrisma = (
  comparison: DateFilterComparison
): keyof Prisma.DateTimeFilter => {
  switch (comparison) {
    case DateFilterComparison.Equal: {
      return 'equals';
    }

    case DateFilterComparison.GreaterThan: {
      return 'gt';
    }

    case DateFilterComparison.GreaterThanOrEqual: {
      return 'gte';
    }

    case DateFilterComparison.LowerThan: {
      return 'lt';
    }

    case DateFilterComparison.LowerThanOrEqual: {
      return 'lte';
    }
  }

  throw new Error('Unimplemented comparison.');
};
