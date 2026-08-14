/**
 * Evaluates a Prisma `where` object against a plain record.
 *
 * Test-only. It covers exactly the operators the audience filters build
 * (`AND`/`OR`, `gte`/`lte`/`lt`/`gt`/`in`, `is: null`, and the `none` relation
 * filter) so a spec can assert which recipients an audience actually includes,
 * instead of only asserting the shape of the query — the shape looks right even
 * when the semantics are wrong.
 */
type Where = Record<string, any>;
type Row = Record<string, any>;

const OPERATORS = new Set([
  'equals',
  'not',
  'gte',
  'gt',
  'lte',
  'lt',
  'in',
  'notIn',
  'is',
  'isNot',
  'none',
  'some',
  'every',
]);

const compare = (value: unknown, expected: unknown): boolean =>
  value instanceof Date && expected instanceof Date ?
    value.getTime() === expected.getTime()
  : value === expected;

const matchesOperators = (value: unknown, condition: Where): boolean =>
  Object.entries(condition).every(([operator, expected]) => {
    switch (operator) {
      case 'equals':
        return compare(value, expected);
      case 'not':
        return !compare(value, expected);
      case 'gte':
        return value != null && (value as any) >= (expected as any);
      case 'gt':
        return value != null && (value as any) > (expected as any);
      case 'lte':
        return value != null && (value as any) <= (expected as any);
      case 'lt':
        return value != null && (value as any) < (expected as any);
      case 'in':
        return (expected as unknown[]).includes(value);
      case 'notIn':
        return !(expected as unknown[]).includes(value);
      case 'is':
        return expected === null ?
            value == null
          : value != null && matches(value as Row, expected as Where);
      case 'isNot':
        return expected === null ?
            value != null
          : !(value != null && matches(value as Row, expected as Where));
      case 'none':
        return ((value ?? []) as Row[]).every(
          item => !matches(item, expected as Where)
        );
      case 'some':
        return ((value ?? []) as Row[]).some(item =>
          matches(item, expected as Where)
        );
      case 'every':
        return ((value ?? []) as Row[]).every(item =>
          matches(item, expected as Where)
        );
      default:
        throw new Error(`where-matcher: unsupported operator "${operator}"`);
    }
  });

export const matches = (row: Row, where: Where): boolean =>
  Object.entries(where).every(([key, condition]) => {
    if (key === 'AND') {
      return (condition as Where[]).every(part => matches(row, part));
    }

    if (key === 'OR') {
      return (condition as Where[]).some(part => matches(row, part));
    }

    if (key === 'NOT') {
      return !matches(row, condition as Where);
    }

    const value = row[key];

    if (condition === null) {
      return value == null;
    }

    if (condition instanceof Date || typeof condition !== 'object') {
      return compare(value, condition);
    }

    // An object of known operators filters the scalar; anything else is a
    // nested filter on a related record (e.g. `deactivation: { date: … }`).
    const keys = Object.keys(condition as Where);
    const isOperatorObject =
      keys.length > 0 && keys.every(candidate => OPERATORS.has(candidate));

    if (isOperatorObject) {
      return matchesOperators(value, condition as Where);
    }

    return value != null && matches(value as Row, condition as Where);
  });
