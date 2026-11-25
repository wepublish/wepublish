import { ErrorCode } from '@wepublish/errors';
import { setTestLocale } from '@wepublish/mocks/website';
import { t } from 'i18next';

import { translateApolloErrorMessage } from './api-alert';

describe('translateApolloErrorMessage', () => {
  it.each([
    ['Email already in use', 'An account with this email already exists.'],
    [
      ErrorCode.PaymentAlreadyRunning,
      'A payment for this invoice is already in progress. Please wait at least a minute before trying again.',
    ],
    [
      ErrorCode.LinkExpired,
      'This link is no longer valid. Please request a new link here or log in with your username and password.',
    ],
    [ErrorCode.PaymentIntentNotFound, 'The payment could not be found.'],
  ])('translates %s into the language of the site', (error, message) => {
    setTestLocale('en');

    expect(translateApolloErrorMessage(error, t)).toBe(message);
  });

  it('passes any other message through', () => {
    expect(translateApolloErrorMessage('Something broke', t)).toBe(
      'Something broke'
    );
  });
});
