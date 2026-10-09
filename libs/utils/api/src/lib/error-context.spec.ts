import {
  addErrorContext,
  describeError,
  ErrorWithContext,
} from './error-context';

class RecipientRefused extends Error {}

describe('describeError', () => {
  it('reads the message of an error', () => {
    expect(describeError(new Error('Connection refused'))).toBe(
      'Connection refused'
    );
  });

  it('reads status and message of a plain object an SDK rejects with', () => {
    expect(
      describeError({ code: 401, message: { message: 'Unauthorized' } })
    ).toBe('401 Unauthorized');
  });

  it('reads status and answer of an HTTP client error', () => {
    const error = Object.assign(
      new Error('Request failed with status code 422'),
      {
        response: {
          status: 422,
          data: { error: 'invalid_request', error_description: 'IBAN invalid' },
        },
      }
    );

    expect(describeError(error)).toBe(
      'Request failed with status code 422 (422 invalid_request: IBAN invalid)'
    );
  });

  it('reads a raw HTTP response', () => {
    expect(
      describeError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        headers: {},
      })
    ).toBe('400 Bad Request');
  });

  it('keeps a string as it is', () => {
    expect(describeError('Timeout')).toBe('Timeout');
  });

  it('shows an object it cannot read on one line instead of [object Object]', () => {
    const described = describeError({ unexpected: { nested: true } });

    expect(described).toContain('unexpected');
    expect(described).not.toContain('[object Object]');
    expect(described).not.toContain('\n');
  });

  it('copes with an object that refers to itself', () => {
    const cyclic: Record<string, unknown> = { reason: 'loop' };
    cyclic['self'] = cyclic;

    expect(describeError(cyclic)).toBe('loop');
  });

  it('says so when there is nothing to describe', () => {
    expect(describeError(undefined)).toBe('Unknown error');
    expect(describeError(null)).toBe('Unknown error');
  });
});

describe('addErrorContext', () => {
  it('puts the context in front of the message and the stack', () => {
    const error = new Error('401 Unauthorized');

    const result = addErrorContext(error, 'Payment provider "Bexio" failed');

    expect(result.message).toBe(
      'Payment provider "Bexio" failed: 401 Unauthorized'
    );
    expect(result.stack?.split('\n')[0]).toBe(
      'Error: Payment provider "Bexio" failed: 401 Unauthorized'
    );
  });

  it('keeps the error itself, so code checking its class still recognises it', () => {
    const error = new RecipientRefused('bounced');

    const result = addErrorContext(error, 'Mail provider "Mailgun" failed');

    expect(result).toBe(error);
    expect(result).toBeInstanceOf(RecipientRefused);
  });

  it('adds the same context only once', () => {
    const error = new Error('down');

    addErrorContext(error, 'Charging invoice 1 failed');
    addErrorContext(error, 'Charging invoice 1 failed');

    expect(error.message).toBe('Charging invoice 1 failed: down');
  });

  it('adds what an HTTP client error answered to its message', () => {
    const error = Object.assign(
      new Error('Request failed with status code 401'),
      { response: { status: 401, data: { message: 'Unauthorized' } } }
    );

    addErrorContext(error, 'Tracking pixel provider "ProLitteris" failed');

    expect(error.message).toBe(
      'Tracking pixel provider "ProLitteris" failed: Request failed with status code 401 (401 Unauthorized)'
    );
  });

  it('nests contexts, the outermost first', () => {
    const error = new Error('401 Unauthorized');

    addErrorContext(error, 'Payment provider "Bexio" failed');
    addErrorContext(error, 'Charging invoice 1 failed');

    expect(error.message).toBe(
      'Charging invoice 1 failed: Payment provider "Bexio" failed: 401 Unauthorized'
    );
  });

  it('turns anything else into an error that keeps the original as its cause', () => {
    const rejection = { code: 401, message: { message: 'Unauthorized' } };

    const result = addErrorContext(
      rejection,
      'Payment provider "Bexio" failed'
    );

    expect(result).toBeInstanceOf(ErrorWithContext);
    expect(result.message).toBe(
      'Payment provider "Bexio" failed: 401 Unauthorized'
    );
    expect((result as ErrorWithContext).cause).toBe(rejection);
  });
});
