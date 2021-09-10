import {DateFilterComparison} from '@wepublish/api'

export function mapDateFilterComparisonToMongoQueryOperatior(
  operator: DateFilterComparison
): string {
  switch (operator) {
    case DateFilterComparison.GreaterThan:
      return '$gt'
    case DateFilterComparison.GreaterThanOrEqual:
      return '$gte'
    case DateFilterComparison.Equal:
      return '$eq'
    case DateFilterComparison.LowerThan:
      return '$lt'
    case DateFilterComparison.LowerThanOrEqual:
      return '$lte'
    default:
      throw new Error('Unknown DateFilterComparison')
  }
}
