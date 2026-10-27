import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockOperation,
  mockSensitiveDataUser,
  mockUserAddress,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  RequestEmailChangeDocument,
  UpdatePasswordDocument,
  UpdateUserDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { PersonalDataFormContainer } from './personal-data-form-container';

const address = {
  streetAddress: 'Cool Street',
  streetAddressNumber: '1234',
  zipCode: '12345',
  city: 'Surfers Paradise',
  country: 'Australien',
};

const currentUser = mockSensitiveDataUser({
  firstName: 'Kamil',
  name: 'Wasyl',
  email: 'some-example@mail.com',
  flair: 'Financial Advisor & CEO',
  birthday: '1990-01-01T00:00:00.000Z',
  address: mockUserAddress(address),
});

const updatedUser = { ...currentUser, firstName: 'Foo' };

const updateUserVariables = {
  name: 'Wasyl',
  firstName: 'Foo',
  flair: 'Financial Advisor & CEO',
  birthday: '1990-01-01T00:00:00.000Z',
  address,
};

const field = (key: string) => screen.getByLabelText(t(key));
const button = (key: string) => screen.getByRole('button', { name: t(key) });

const renameTo = async (
  reader: ReturnType<typeof userEvent.setup>,
  firstName: string
) => {
  await reader.clear(field('user.form.firstName'));
  await reader.type(field('user.form.firstName'), firstName);
};

describe('PersonalDataFormContainer', () => {
  it('saves the changed personal data', async () => {
    const reader = userEvent.setup();

    renderWithProviders(<PersonalDataFormContainer />, {
      user: currentUser,
      mocks: [
        mockOperation(UpdateUserDocument, {
          variables: updateUserVariables,
          data: { __typename: 'Mutation', updateCurrentUser: updatedUser },
        }),
      ],
    });

    await renameTo(reader, 'Foo');
    await reader.click(button('user.save'));

    expect(await screen.findByText(t('user.saveSuccess'))).toBeInTheDocument();
  });

  it('also changes the password when a new one is entered', async () => {
    const reader = userEvent.setup();

    renderWithProviders(<PersonalDataFormContainer />, {
      user: currentUser,
      mocks: [
        mockOperation(UpdateUserDocument, {
          variables: updateUserVariables,
          data: { __typename: 'Mutation', updateCurrentUser: updatedUser },
        }),
        mockOperation(UpdatePasswordDocument, {
          variables: {
            password: 'supersecret123',
            passwordRepeated: 'supersecret123',
          },
          data: { __typename: 'Mutation', updatePassword: updatedUser },
        }),
      ],
    });

    await renameTo(reader, 'Foo');
    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret123');
    await reader.click(button('user.save'));

    expect(await screen.findByText(t('user.saveSuccess'))).toBeInTheDocument();
  });

  it('shows the error from the server when saving fails', async () => {
    const reader = userEvent.setup();

    renderWithProviders(<PersonalDataFormContainer />, {
      user: currentUser,
      mocks: [
        mockOperation(UpdateUserDocument, {
          variables: updateUserVariables,
          errors: [{ message: 'Something went wrong.' }],
        }),
      ],
    });

    await renameTo(reader, 'Foo');
    await reader.click(button('user.save'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
    expect(screen.queryByText(t('user.saveSuccess'))).not.toBeInTheDocument();
  });

  it('requests an email change', async () => {
    const reader = userEvent.setup();

    renderWithProviders(<PersonalDataFormContainer />, {
      user: currentUser,
      mocks: [
        mockOperation(RequestEmailChangeDocument, {
          variables: { newEmail: 'foobar@email.com' },
          data: { __typename: 'Mutation', requestEmailChange: true },
        }),
      ],
    });

    await reader.click(button('user.changeEmail'));
    await reader.type(field('user.newEmail'), 'foobar@email.com');
    await reader.click(button('user.requestEmailChange'));

    expect(
      await screen.findByText(t('user.emailChangeRequested'))
    ).toBeInTheDocument();
  });

  it('shows the error from the server when the email change fails', async () => {
    const reader = userEvent.setup();

    renderWithProviders(<PersonalDataFormContainer />, {
      user: currentUser,
      mocks: [
        mockOperation(RequestEmailChangeDocument, {
          variables: { newEmail: 'foobar@email.com' },
          errors: [{ message: 'Email already taken.' }],
        }),
      ],
    });

    await reader.click(button('user.changeEmail'));
    await reader.type(field('user.newEmail'), 'foobar@email.com');
    await reader.click(button('user.requestEmailChange'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already taken.'
    );
  });

  it('renders nothing for logged out readers', () => {
    const { container } = renderWithProviders(<PersonalDataFormContainer />);

    expect(container).toBeEmptyDOMElement();
  });
});
