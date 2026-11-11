import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockChallengeToken,
  mockOperation,
  mockSensitiveDataUser,
  mockSessionWithoutUser,
  renderWithProviders,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import { ChallengeDocument, RegisterDocument } from '@wepublish/website/api';
import { t } from 'i18next';
import { useUser } from '../session.context';
import { RegistrationFormContainer } from './registration-form-container';

const session = mockSessionWithoutUser();
const firstChallenge = mockChallenge({ challengeID: 'first-challenge' });

const challengeQuery = (challenge = firstChallenge) =>
  mockOperation(ChallengeDocument, {
    data: { __typename: 'Query', challenge },
  });

const registerVariables = (challengeID = 'first-challenge') => ({
  name: 'Bar',
  email: 'foobar@email.com',
  challengeAnswer: {
    challengeID,
    challengeSolution: mockChallengeToken,
  },
});

const SessionStatus = () => {
  const { hasUser } = useUser();

  return <p>{hasUser ? 'logged in' : 'logged out'}</p>;
};

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(t('user.form.lastName')), 'Bar');
  await user.type(
    screen.getByLabelText(t('user.form.email')),
    'foobar@email.com'
  );
  await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
  await user.click(
    screen.getByRole('button', { name: t('registrationForm.register') })
  );
};

const renderContainer = (mocks: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <>
      <SessionStatus />
      <RegistrationFormContainer fields={[]} />
    </>,
    mocks
  );

describe('RegistrationFormContainer', () => {
  it('registers with the solved challenge and logs the new member in', async () => {
    const user = userEvent.setup();
    const { setToken } = renderContainer({
      mocks: [
        challengeQuery(),
        mockOperation(RegisterDocument, {
          variables: registerVariables(),
          data: {
            __typename: 'Mutation',
            registerMember: {
              __typename: 'Registration',
              session,
              user: mockSensitiveDataUser({
                firstName: null,
                name: 'Bar',
                email: 'foobar@email.com',
              }),
            },
          },
        }),
      ],
    });

    await fillAndSubmit(user);

    expect(await screen.findByText('logged in')).toBeInTheDocument();
    expect(setToken).toHaveBeenCalledWith(session);
  });

  it('does not load a challenge for a member who is already logged in', () => {
    renderContainer({ user: mockSensitiveDataUser() });

    expect(
      screen.queryByRole('group', { name: TEST_CAPTCHA_LABEL })
    ).not.toBeInTheDocument();
  });

  it('shows why the challenge could not be loaded', async () => {
    renderContainer({
      mocks: [
        mockOperation(ChallengeDocument, {
          errors: [{ message: 'Something went wrong.' }],
        }),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
  });

  it('shows why the registration failed, stays logged out and loads a fresh challenge', async () => {
    const user = userEvent.setup();
    const { setToken } = renderContainer({
      mocks: [
        challengeQuery(),
        mockOperation(RegisterDocument, {
          variables: registerVariables(),
          errors: [{ message: 'Email already in use.' }],
        }),
        challengeQuery(mockChallenge({ challengeID: 'second-challenge' })),
      ],
    });

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already in use.'
    );
    await waitFor(() =>
      expect(
        screen.getByRole('group', { name: TEST_CAPTCHA_LABEL })
      ).toHaveAttribute('data-sitekey', 'second-challenge')
    );
    expect(screen.getByText('logged out')).toBeInTheDocument();
    expect(setToken).not.toHaveBeenCalled();
  });
});
