import { CombinedGraphQLErrors, ServerError } from '@apollo/client';

import { humanizeError } from './humanizeError';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;

const prismaUniqueEmail = `
Invalid \`this.prisma.user.update()\` invocation in
/home/app/dist/apps/api-example/main.js:36793:49

  36790         userImageID: true
→ 36793 const user = yield this.prisma.user.update(
Unique constraint failed on the fields: (\`email\`)`;

const graphQLError = (message: string, code?: string) =>
  new CombinedGraphQLErrors({
    errors: [{ message, extensions: code ? { code } : {} }],
  });

const serverError = (status: number) =>
  new ServerError('Response not successful', {
    response: new Response(null, { status }),
    bodyText: '',
  });

describe('humanizeError', () => {
  it('explains a duplicate value instead of showing the Prisma dump', () => {
    expect(humanizeError(graphQLError(prismaUniqueEmail), t)).toBe(
      'errors.uniqueEmail'
    );
  });

  it('names the field for other duplicate values', () => {
    expect(
      humanizeError(
        graphQLError(
          'Invalid `this.prisma.page.create()` invocation: Unique constraint failed on the fields: (`slug`)'
        ),
        t
      )
    ).toBe('errors.uniqueField {"field":"slug"}');
  });

  it('explains a record that is still referenced elsewhere', () => {
    expect(
      humanizeError(
        graphQLError(
          'Invalid `prisma.tag.delete()` invocation: Foreign key constraint violated on the constraint: `TaggedArticles_tagId_fkey`'
        ),
        t
      )
    ).toBe('errors.inUse');
  });

  it('hides other internal database errors', () => {
    expect(
      humanizeError(
        graphQLError(
          'Invalid `this.prisma.article.findMany()` invocation in /srv/main.js:1:1 Something exploded'
        ),
        t
      )
    ).toBe('errors.unexpected');
  });

  it('reports missing permissions', () => {
    expect(
      humanizeError(graphQLError('Forbidden resource', 'FORBIDDEN'), t)
    ).toBe('errors.forbidden');
  });

  it('reports a missing connection to the server', () => {
    expect(humanizeError(new TypeError('Failed to fetch'), t)).toBe(
      'errors.network'
    );
  });

  it('keeps readable messages from the API', () => {
    expect(
      humanizeError(
        graphQLError('The slug is already taken by another page.'),
        t
      )
    ).toBe('The slug is already taken by another page.');
  });

  it('reports a rejected session as missing permission', () => {
    expect(humanizeError(serverError(401), t)).toBe('errors.forbidden');
    expect(humanizeError(serverError(403), t)).toBe('errors.forbidden');
  });

  it('hides other server failures behind a generic message', () => {
    expect(humanizeError(serverError(502), t)).toBe('errors.unexpected');
  });

  it('reads the message of error-like objects', () => {
    expect(humanizeError({ message: 'Name is required' }, t)).toBe(
      'Name is required'
    );
  });

  it('accepts plain strings and unknown values', () => {
    expect(humanizeError('Already exists', t)).toBe('Already exists');
    expect(humanizeError(undefined, t)).toBe('errors.unexpected');
  });
});
