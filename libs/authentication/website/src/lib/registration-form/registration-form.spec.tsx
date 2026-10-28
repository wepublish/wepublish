import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockChallengeToken,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import { ComponentProps } from 'react';
import { z } from 'zod';
import { RegistrationForm } from './registration-form';

const idle = { data: undefined, loading: false, error: undefined };
const challenge = mockChallenge();
const solvedChallenge = {
  ...idle,
  data: { __typename: 'Query' as const, challenge },
};

type Props = ComponentProps<typeof RegistrationForm>;

const renderRegistrationForm = (props: Partial<Props> = {}) => {
  const onRegister = vi.fn();

  renderWithProviders(
    <RegistrationForm
      challenge={solvedChallenge}
      register={idle}
      onRegister={onRegister}
      {...props}
    />
  );

  return { onRegister, user: userEvent.setup() };
};

const field = (key: string) => screen.getByLabelText(t(key));
const registerButton = () =>
  screen.getByRole('button', { name: t('registrationForm.register') });

const allFieldLabels = [
  'user.form.firstName',
  'user.form.lastName',
  'user.form.email',
  'user.form.emailRepeated',
  'user.form.birthday',
  'user.form.password',
  'user.form.passwordRepeated',
  'user.form.street',
  'user.form.houseNumber',
  'user.form.zipCode',
  'user.form.city',
  'user.form.country',
];

const visibleFieldLabels = () =>
  allFieldLabels.filter(key => screen.queryAllByLabelText(t(key)).length);

describe('RegistrationForm', () => {
  it('marks the required fields when submitted empty', async () => {
    const { user, onRegister } = renderRegistrationForm();

    await user.click(registerButton());

    for (const key of [
      'user.form.firstName',
      'user.form.lastName',
      'user.form.email',
      'user.form.password',
      'user.form.street',
      'user.form.city',
    ]) {
      await waitFor(() =>
        expect(field(key)).toHaveAttribute('aria-invalid', 'true')
      );
    }

    expect(onRegister).not.toHaveBeenCalled();
  });

  it('registers with everything the reader entered and the captcha token', async () => {
    const { user, onRegister } = renderRegistrationForm();

    await user.type(field('user.form.firstName'), 'Foo');
    await user.type(field('user.form.lastName'), 'Bar');
    await user.type(field('user.form.email'), 'foobar@email.com');
    await user.type(field('user.form.password'), 'supersecret123');
    await user.type(field('user.form.passwordRepeated'), 'supersecret123');
    await user.type(field('user.form.street'), 'Musterstrasse');
    await user.type(field('user.form.houseNumber'), '1');
    await user.type(field('user.form.zipCode'), '8047');
    await user.type(field('user.form.city'), 'Zürich');
    await user.type(field('user.form.country'), 'Schweiz{enter}');
    await user.click(registerButton());

    await waitFor(() =>
      expect(onRegister).toHaveBeenCalledWith({
        firstName: 'Foo',
        name: 'Bar',
        email: 'foobar@email.com',
        password: 'supersecret123',
        passwordRepeated: 'supersecret123',
        address: {
          streetAddress: 'Musterstrasse',
          streetAddressNumber: '1',
          zipCode: '8047',
          city: 'Zürich',
          country: 'Schweiz',
        },
        challengeAnswer: {
          challengeID: challenge.challengeID,
          challengeSolution: mockChallengeToken,
        },
      })
    );
  });

  it.each([
    [[], ['user.form.lastName', 'user.form.email']],
    [
      ['firstName'],
      ['user.form.firstName', 'user.form.lastName', 'user.form.email'],
    ],
    [
      ['birthday'],
      ['user.form.lastName', 'user.form.email', 'user.form.birthday'],
    ],
    [
      ['address'],
      [
        'user.form.lastName',
        'user.form.email',
        'user.form.street',
        'user.form.houseNumber',
        'user.form.zipCode',
        'user.form.city',
        'user.form.country',
      ],
    ],
    [
      ['password'],
      ['user.form.lastName', 'user.form.email', 'user.form.password'],
    ],
    [
      ['emailRepeated', 'password', 'passwordRepeated'],
      [
        'user.form.lastName',
        'user.form.email',
        'user.form.emailRepeated',
        'user.form.password',
        'user.form.passwordRepeated',
      ],
    ],
  ] as const)(
    'renders only the name, the email and the fields %j',
    (fields, expected) => {
      renderRegistrationForm({ fields: [...fields] });

      expect(visibleFieldLabels()).toEqual(expected);
    }
  );

  it('registers with only the name and the email when no other fields are asked for', async () => {
    const { user, onRegister } = renderRegistrationForm({ fields: [] });

    await user.type(field('user.form.lastName'), 'Bar');
    await user.type(field('user.form.email'), 'foobar@email.com');
    await user.click(registerButton());

    await waitFor(() =>
      expect(onRegister).toHaveBeenCalledWith({
        name: 'Bar',
        email: 'foobar@email.com',
        challengeAnswer: {
          challengeID: challenge.challengeID,
          challengeSolution: mockChallengeToken,
        },
      })
    );
  });

  it('flags a repeated password that does not match', async () => {
    const { user, onRegister } = renderRegistrationForm({
      fields: ['password', 'passwordRepeated'],
    });

    await user.type(field('user.form.password'), 'supersecret123');
    await user.type(field('user.form.passwordRepeated'), 'supersecret124');
    await user.click(registerButton());

    await waitFor(() =>
      expect(field('user.form.passwordRepeated')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(field('user.form.password')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    expect(onRegister).not.toHaveBeenCalled();
  });

  it('flags a repeated email that does not match', async () => {
    const { user, onRegister } = renderRegistrationForm({
      fields: ['emailRepeated'],
    });

    await user.type(field('user.form.lastName'), 'Bar');
    await user.type(field('user.form.email'), 'foobar@email.com');
    await user.type(field('user.form.emailRepeated'), 'foobaz@email.com');
    await user.click(registerButton());

    await waitFor(() =>
      expect(field('user.form.emailRepeated')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(onRegister).not.toHaveBeenCalled();
  });

  it('applies a stricter schema given by the tenant', async () => {
    const { user, onRegister } = renderRegistrationForm({
      fields: ['password'],
      schema: z.object({ password: z.string().min(16) }),
    });

    await user.type(field('user.form.lastName'), 'Bar');
    await user.type(field('user.form.email'), 'foobar@email.com');
    await user.type(field('user.form.password'), 'supersecret123');
    await user.click(registerButton());

    await waitFor(() =>
      expect(field('user.form.password')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(onRegister).not.toHaveBeenCalled();
  });

  it('shows why the challenge could not be loaded', () => {
    renderRegistrationForm({
      challenge: { ...idle, error: new Error('Something went wrong.') },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
  });

  it('shows why the registration failed', () => {
    renderRegistrationForm({
      register: { ...idle, error: new Error('Email already in use.') },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email already in use.'
    );
  });

  it.each([
    ['the challenge is loading', { challenge: { ...idle, loading: true } }],
    ['the registration is sent', { register: { ...idle, loading: true } }],
  ])('blocks the submit while %s', (_, props) => {
    renderRegistrationForm(props as Partial<Props>);

    expect(registerButton()).toBeDisabled();
  });
});
