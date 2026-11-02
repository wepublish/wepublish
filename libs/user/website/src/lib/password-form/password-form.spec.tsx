import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { t } from 'i18next';
import { z } from 'zod';

import { PasswordForm, PasswordFormProps } from './password-form';

const renderForm = (overrides: Partial<PasswordFormProps> = {}) => {
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <PasswordForm
      onUpdate={onUpdate}
      {...overrides}
    />
  );

  return { onUpdate, reader: userEvent.setup() };
};

const field = (key: string) => screen.getByLabelText(t(key));
const saveButton = () => screen.getByRole('button', { name: t('user.save') });

describe('PasswordForm', () => {
  it('changes the password and clears the fields', async () => {
    const { reader, onUpdate } = renderForm();

    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret123');
    await reader.click(saveButton());

    expect(onUpdate).toHaveBeenCalledWith({
      password: 'supersecret123',
      passwordRepeated: 'supersecret123',
    });
    expect(await screen.findByText(t('user.saveSuccess'))).toBeInTheDocument();
    expect(field('user.password')).toHaveValue('');
    expect(field('user.passwordRepeat')).toHaveValue('');
  });

  it('requires a new password', async () => {
    const { reader, onUpdate } = renderForm();

    await reader.click(saveButton());

    expect(field('user.password')).toHaveAttribute('aria-invalid', 'true');
    expect(
      await screen.findByText(t('zod.errors.invalid_type_received_undefined'))
    ).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('flags a repeated password that does not match', async () => {
    const { reader, onUpdate } = renderForm();

    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret124');
    await reader.click(saveButton());

    expect(
      await screen.findByText(t('user.form.passwordsDoNotMatch'))
    ).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 12 characters', async () => {
    const { reader, onUpdate } = renderForm();

    await reader.type(field('user.password'), '12345678');
    await reader.type(field('user.passwordRepeat'), '12345678');
    await reader.click(saveButton());

    expect(field('user.password')).toHaveAttribute('aria-invalid', 'true');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('applies a stricter password rule from the profile schema', async () => {
    const { reader, onUpdate } = renderForm({
      schema: z.object({
        firstName: z.string().optional(),
        password: z.string().min(16).optional().or(z.literal('')),
        passwordRepeated: z.string().min(16).optional().or(z.literal('')),
      }),
    });

    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret123');
    await reader.click(saveButton());

    expect(field('user.password')).toHaveAttribute('aria-invalid', 'true');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('shows why the password could not be changed', async () => {
    const { reader } = renderForm({
      onUpdate: vi.fn().mockRejectedValue(new Error('Passwort zu einfach')),
    });

    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret123');
    await reader.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Passwort zu einfach'
    );
  });
});
