import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockOperation,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { UpdatePasswordDocument } from '@wepublish/website/api';
import { t } from 'i18next';

import { PasswordFormContainer } from './password-form-container';

const user = mockSensitiveDataUser();

describe('PasswordFormContainer', () => {
  it('changes the password of the signed-in reader', async () => {
    const result = vi.fn(() => ({
      data: { __typename: 'Mutation' as const, updatePassword: user },
    }));
    renderWithProviders(<PasswordFormContainer />, {
      user,
      mocks: [
        {
          ...mockOperation(UpdatePasswordDocument, {
            variables: {
              password: 'supersecret123',
              passwordRepeated: 'supersecret123',
            },
            data: { __typename: 'Mutation', updatePassword: user },
          }),
          result,
        },
      ],
    });
    const reader = userEvent.setup();

    await reader.type(
      screen.getByLabelText(t('user.password')),
      'supersecret123'
    );
    await reader.type(
      screen.getByLabelText(t('user.passwordRepeat')),
      'supersecret123'
    );
    await reader.click(screen.getByRole('button', { name: t('user.save') }));

    expect(await screen.findByText(t('user.saveSuccess'))).toBeInTheDocument();
    expect(result).toHaveBeenCalledTimes(1);
  });

  it('shows nothing without a signed-in reader', () => {
    const { container } = renderWithProviders(<PasswordFormContainer />);

    expect(container).toBeEmptyDOMElement();
  });
});
