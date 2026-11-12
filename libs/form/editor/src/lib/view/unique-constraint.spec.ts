import { CombinedGraphQLErrors } from '@apollo/client';

import { uniqueConstraint, uniqueViolationOf } from './unique-constraint';

const productionMessage =
  '\nInvalid `this.prisma.consent.create()` invocation in\n/app/dist/main.js:93374:46\n\n  93371 }\n  93372 createConsent(consent) {\n  93373     return __awaiter(this, void 0, void 0, function* () {\n→ 93374         return yield this.prisma.consent.create(\nUnique constraint failed on the constraint: `consents_slug_key`';

const graphQLError = (message: string) =>
  new CombinedGraphQLErrors({ errors: [{ message }] });

describe('uniqueViolationOf', () => {
  it('reads the index name of the message the API sends today', () => {
    expect(uniqueViolationOf(graphQLError(productionMessage))).toEqual({
      columns: undefined,
      index: 'consents_slug_key',
    });
  });

  it('reads the columns of the fields form', () => {
    expect(
      uniqueViolationOf(
        new Error('Unique constraint failed on the fields: (`type`,`tag`)')
      )
    ).toEqual({ columns: ['type', 'tag'], index: undefined });
  });

  it('knows a violation that names neither columns nor an index', () => {
    expect(
      uniqueViolationOf(
        new Error('Unique constraint failed on the (not available)')
      )
    ).toEqual({ columns: undefined, index: undefined });
  });

  it('returns undefined for other errors and for non-errors', () => {
    expect(
      uniqueViolationOf(new Error('Something went wrong'))
    ).toBeUndefined();
    expect(
      uniqueViolationOf(graphQLError('Forbidden resource'))
    ).toBeUndefined();
    expect(uniqueViolationOf('Unique constraint failed')).toBeUndefined();
    expect(uniqueViolationOf(undefined)).toBeUndefined();
  });

  it('looks at every GraphQL error, not only the first', () => {
    expect(
      uniqueViolationOf(
        new CombinedGraphQLErrors({
          errors: [
            { message: 'Something else' },
            {
              message:
                'Unique constraint failed on the constraint: `paywalls_name_key`',
            },
          ],
        })
      )
    ).toEqual({ columns: undefined, index: 'paywalls_name_key' });
  });
});

describe('uniqueConstraint', () => {
  it('maps the message the API sends today to the slug', () => {
    expect(uniqueConstraint('slug')(graphQLError(productionMessage))).toBe(
      true
    );
    expect(uniqueConstraint('name')(graphQLError(productionMessage))).toBe(
      false
    );
  });

  it('matches a composite index in either column order', () => {
    const error = graphQLError(
      'Unique constraint failed on the constraint: `tags_type_tag_key`'
    );

    expect(uniqueConstraint('tag', 'type')(error)).toBe(true);
    expect(uniqueConstraint('type', 'tag')(error)).toBe(true);
    expect(uniqueConstraint('type')(error)).toBe(false);
  });

  it('cannot tell a trailing column from a composite index ending in it', () => {
    expect(
      uniqueConstraint('tag')(
        graphQLError(
          'Unique constraint failed on the constraint: `tags_type_tag_key`'
        )
      )
    ).toBe(true);
  });

  it('matches indexes of tables with dashes and keys named key', () => {
    expect(
      uniqueConstraint(
        'userId',
        'consentId'
      )(
        graphQLError(
          'Unique constraint failed on the constraint: `user-consents_userId_consentId_key`'
        )
      )
    ).toBe(true);
    expect(
      uniqueConstraint('key')(
        graphQLError(
          'Unique constraint failed on the constraint: `navigations_key_key`'
        )
      )
    ).toBe(true);
  });

  it('matches the fields form by the set of columns', () => {
    const error = new Error(
      'Unique constraint failed on the fields: (`type`, `tag`)'
    );

    expect(uniqueConstraint('tag', 'type')(error)).toBe(true);
    expect(uniqueConstraint('tag')(error)).toBe(false);
  });

  it('matches a violation without details only without columns', () => {
    const error = new Error('Unique constraint failed on the (not available)');

    expect(uniqueConstraint()(error)).toBe(true);
    expect(uniqueConstraint('slug')(error)).toBe(false);
  });

  it('matches any unique violation without columns and nothing else', () => {
    expect(uniqueConstraint()(graphQLError(productionMessage))).toBe(true);
    expect(uniqueConstraint()(new Error('Something went wrong'))).toBe(false);
  });
});
