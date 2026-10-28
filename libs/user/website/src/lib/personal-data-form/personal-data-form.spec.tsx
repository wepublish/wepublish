import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockSensitiveDataUser,
  mockUserAddress,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderPersonalDataFormProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { z } from 'zod';
import { PersonalDataForm } from './personal-data-form';

const address = {
  streetAddress: 'Cool Street',
  streetAddressNumber: '1234',
  zipCode: '12345',
  city: 'Surfers Paradise',
  country: 'Australien',
};

const user = mockSensitiveDataUser({
  firstName: 'Kamil',
  name: 'Wasyl',
  email: 'some-example@mail.com',
  flair: 'Financial Advisor & CEO',
  birthday: '1990-01-01T00:00:00.000Z',
  address: mockUserAddress(address),
});

type Props = BuilderPersonalDataFormProps<
  NonNullable<BuilderPersonalDataFormProps['fields']>[number]
>;

const renderForm = (overrides: Partial<Props> = {}) => {
  const props = {
    user,
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onImageUpload: vi.fn().mockResolvedValue(undefined),
    onRequestEmailChange: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  renderWithProviders(<PersonalDataForm {...props} />);

  return {
    onUpdate: props.onUpdate,
    onRequestEmailChange: props.onRequestEmailChange,
    user: userEvent.setup(),
  };
};

const field = (key: string) => screen.getByLabelText(t(key));
const saveButton = () => screen.getByRole('button', { name: t('user.save') });

describe('PersonalDataForm', () => {
  it('fills the form with the current user data', () => {
    renderForm();

    expect(field('user.form.firstName')).toHaveValue('Kamil');
    expect(field('user.form.lastName')).toHaveValue('Wasyl');
    expect(field('user.form.occupation')).toHaveValue(
      'Financial Advisor & CEO'
    );
    expect(field('user.email')).toHaveValue('some-example@mail.com');
    expect(field('user.email')).toBeDisabled();
  });

  it('saves the changed data together with the new password', async () => {
    const { user: reader, onUpdate } = renderForm();

    await reader.clear(field('user.form.firstName'));
    await reader.type(field('user.form.firstName'), 'Foo');
    await reader.clear(field('user.form.occupation'));
    await reader.type(
      field('user.form.occupation'),
      'Wordpress Ninja & CSS Shaolin'
    );
    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret123');
    await reader.click(saveButton());

    expect(await screen.findByText(t('user.saveSuccess'))).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({
      name: 'Wasyl',
      firstName: 'Foo',
      flair: 'Wordpress Ninja & CSS Shaolin',
      password: 'supersecret123',
      passwordRepeated: 'supersecret123',
      birthday: '1990-01-01T00:00:00.000Z',
      address,
    });
  });

  it('flags a repeated password that does not match', async () => {
    const { user: reader, onUpdate } = renderForm();

    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret124');
    await reader.click(saveButton());

    expect(
      await screen.findByText(t('user.form.passwordsDoNotMatch'))
    ).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 12 characters', async () => {
    const { user: reader, onUpdate } = renderForm();

    await reader.type(field('user.password'), '12345678');
    await reader.type(field('user.passwordRepeat'), '12345678');
    await reader.click(saveButton());

    expect(field('user.password')).toHaveAttribute('aria-invalid', 'true');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('applies a stricter password rule from a custom schema', async () => {
    const { user: reader, onUpdate } = renderForm({
      fields: ['password'],
      schema: z.object({
        password: z.string().min(16).optional().or(z.literal('')),
        passwordRepeated: z.string().min(16).optional().or(z.literal('')),
      }) as Props['schema'],
    });

    await reader.type(field('user.password'), 'supersecret123');
    await reader.type(field('user.passwordRepeat'), 'supersecret123');
    await reader.click(saveButton());

    expect(field('user.password')).toHaveAttribute('aria-invalid', 'true');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('requires a last name', async () => {
    const { user: reader, onUpdate } = renderForm({ fields: [] });

    await reader.clear(field('user.form.lastName'));
    await reader.click(saveButton());

    expect(field('user.form.lastName')).toHaveAttribute('aria-invalid', 'true');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('shows only the fields it is given', () => {
    renderForm({ fields: ['flair'] });

    expect(field('user.form.occupation')).toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('user.form.firstName'))
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(t('user.password'))).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('user.form.street'))
    ).not.toBeInTheDocument();
  });

  it('saves the birthday and keeps the hidden fields as they are', async () => {
    const { user: reader, onUpdate } = renderForm({ fields: ['birthday'] });

    await reader.click(saveButton());

    expect(await screen.findByText(t('user.saveSuccess'))).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({
      name: 'Wasyl',
      firstName: 'Kamil',
      flair: 'Financial Advisor & CEO',
      birthday: '1990-01-01T00:00:00.000Z',
      address,
    });
  });

  it('shows the error when saving fails', async () => {
    const { user: reader } = renderForm({
      onUpdate: vi.fn().mockRejectedValue(new Error('Something went wrong.')),
    });

    await reader.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
    expect(screen.queryByText(t('user.saveSuccess'))).not.toBeInTheDocument();
  });

  it('disables saving while the update runs', async () => {
    const { user: reader, onUpdate } = renderForm({
      onUpdate: vi.fn(() => new Promise<void>(() => undefined)),
    });

    await reader.click(saveButton());

    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
    expect(saveButton()).toBeDisabled();
  });

  it('requests an email change and confirms it', async () => {
    const { user: reader, onRequestEmailChange } = renderForm();

    await reader.click(
      screen.getByRole('button', { name: t('user.changeEmail') })
    );
    await reader.type(field('user.newEmail'), 'foobar@email.com');
    await reader.click(
      screen.getByRole('button', { name: t('user.requestEmailChange') })
    );

    expect(
      await screen.findByText(t('user.emailChangeRequested'))
    ).toBeInTheDocument();
    expect(onRequestEmailChange).toHaveBeenCalledWith('foobar@email.com');
    expect(screen.queryByLabelText(t('user.newEmail'))).not.toBeInTheDocument();
  });

  it('only lets the reader request an email change once an email is entered', async () => {
    const { user: reader } = renderForm();

    await reader.click(
      screen.getByRole('button', { name: t('user.changeEmail') })
    );

    expect(
      screen.getByRole('button', { name: t('user.requestEmailChange') })
    ).toBeDisabled();
  });

  it('shows the error when the email change fails', async () => {
    const { user: reader } = renderForm({
      onRequestEmailChange: vi
        .fn()
        .mockRejectedValue(new Error('Email already taken.')),
    });

    await reader.click(
      screen.getByRole('button', { name: t('user.changeEmail') })
    );
    await reader.type(field('user.newEmail'), 'foobar@email.com');
    await reader.click(
      screen.getByRole('button', { name: t('user.requestEmailChange') })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already taken.'
    );
  });

  it('offers no email change without a handler', () => {
    renderForm({ onRequestEmailChange: undefined });

    expect(
      screen.queryByRole('button', { name: t('user.changeEmail') })
    ).not.toBeInTheDocument();
  });

  it('shows the pending email change', () => {
    renderForm({ user: { ...user, pendingEmail: 'new-email@mail.com' } });

    expect(
      screen.getByText(
        t('user.pendingEmailChange', { email: 'new-email@mail.com' })
      )
    ).toBeInTheDocument();
  });

  // the field and the validation agree on a cleared country
  describe('clearing the country', () => {
    it('empties the field and marks it until a country is picked again', async () => {
      const { user: reader } = renderForm();

      await reader.clear(field('user.form.country'));
      await reader.click(field('user.form.zipCode'));

      expect(field('user.form.country')).toHaveValue('');
      expect(field('user.form.country')).toHaveAttribute(
        'aria-invalid',
        'true'
      );

      await reader.type(field('user.form.country'), 'Australien{enter}');

      expect(field('user.form.country')).toHaveAttribute(
        'aria-invalid',
        'false'
      );
    });

    it('saves nothing, not the country from before', async () => {
      const { user: reader, onUpdate } = renderForm();

      await reader.clear(field('user.form.country'));
      await reader.click(field('user.form.zipCode'));
      await reader.click(saveButton());

      expect(field('user.form.country')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });
});
