// @vitest-environment node
import { ServerError } from '@apollo/client';
import { ApiError } from 'next/dist/server/api-utils';
import { withoutClientErrors } from './request-error';

const request = { path: '/api/atom-feed', method: 'POST', headers: {} };
const context = {
  routerKind: 'Pages Router',
  routePath: '/api/atom-feed',
  routeType: 'route',
} as const;

describe('withoutClientErrors', () => {
  it('drops the 400 Next answers for a malformed JSON body', () => {
    const capture = vi.fn();

    withoutClientErrors(capture)(
      new ApiError(400, 'Invalid JSON'),
      request,
      context
    );

    expect(capture).not.toHaveBeenCalled();
  });

  it('drops the 413 Next answers for an oversized body', () => {
    const capture = vi.fn();

    withoutClientErrors(capture)(
      new ApiError(413, 'Body exceeded 1mb limit'),
      request,
      context
    );

    expect(capture).not.toHaveBeenCalled();
  });

  it.each([
    [
      'an API 400 surfacing through Apollo',
      new ServerError('Response not successful: Received status code 400', {
        response: new Response(null, { status: 400 }),
        bodyText: '',
      }),
    ],
    ['a plain error', new Error('boom')],
    ['a server ApiError', new ApiError(500, 'boom')],
    ['a non-error value', 'boom'],
  ])('reports %s', (_, error) => {
    const capture = vi.fn();

    withoutClientErrors(capture)(error, request, context);

    expect(capture).toHaveBeenCalledWith(error, request, context);
  });
});
