import { renderEditorForm } from '../../testing';
import { clearButtonOf } from '../../testing/autocomplete';
import { userFixture, userListMock } from '../../testing/picker-mocks';
import { screen, waitFor } from '@testing-library/react';
import type { FormDefaultValues } from '@wepublish/form/core';
import type { UserSearchValue } from '@wepublish/ui/editor';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const matteo = userFixture('user-matteo', 'Matteo', 'Wyss');
const anna = userFixture('user-anna', 'Anna', 'Keller');

const schema = z.object({
  owner: formFields.user().nullish().meta({
    label: 'comments.edit.user',
    helperText: 'comments.edit.userHelp',
  }),
  subscriber: formFields.user().meta({ label: 'userSubscriptionEdit.user' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  defaultValues,
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  defaultValues?: FormDefaultValues<typeof schema>;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, { defaultValues });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="owner"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="subscriber" />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const loadedSchema = z.object({
  user: formFields.user<UserSearchValue>().meta({ label: 'userConsents.user' }),
});

const LoadedField = editorForm.fieldsFor(loadedSchema).Field;

function LoadedView({
  onSubmit = vi.fn(),
  defaultValues,
}: {
  onSubmit?: (values: z.output<typeof loadedSchema>) => unknown;
  defaultValues?: FormDefaultValues<typeof loadedSchema>;
}) {
  const handle = editorForm.useSchemaForm(loadedSchema, { defaultValues });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <LoadedField name="user" />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const picker = (name: RegExp) => screen.getByRole('combobox', { name });

const owner = () => picker(/^comments\.edit\.user/);
const subscriber = () => picker(/^userSubscriptionEdit\.user\*/);

const mocks = () => [userListMock([matteo, anna])];

describe('UserField', () => {
  it('labels the search, marks a required one and explains it', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    expect(owner()).not.toHaveAccessibleName(/\*/);
    expect(owner()).not.toBeRequired();
    expect(owner()).toHaveAccessibleDescription('comments.edit.userHelp');
    expect(subscriber()).toBeRequired();
  });

  it('searches users and submits the picked user objects', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.type(owner(), 'anna');
    await user.click(
      await screen.findByRole('option', { name: /^Anna Keller/ })
    );
    await user.click(subscriber());
    await user.click(
      await screen.findByRole('option', { name: /^Matteo Wyss/ })
    );
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          owner: expect.objectContaining({
            id: 'user-anna',
            email: 'user-anna@example.com',
          }),
          subscriber: expect.objectContaining({ id: 'user-matteo' }),
        },
        expect.anything()
      )
    );
  });

  it('shows a stored user and submits null once cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ owner: matteo, subscriber: anna }}
      />,
      { mocks: mocks() }
    );

    expect((owner() as HTMLInputElement).value).toMatch(
      /^Matteo Wyss \| user-matteo@example\.com/
    );

    await user.click(await clearButtonOf(user, owner()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          owner: null,
          subscriber: expect.objectContaining({ id: 'user-anna' }),
        },
        expect.anything()
      )
    );
  });

  it('shows the required error once an empty required search is left', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(subscriber());
    await user.keyboard('{Escape}');
    await user.click(document.body);

    await waitFor(() =>
      expect(subscriber()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(subscriber()).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the required error of an empty required search on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(subscriber()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(subscriber()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a user that carries only its names and submits the full user picked instead', async () => {
    const onSubmit = vi.fn();
    const loaded = {
      __typename: 'User' as const,
      id: 'user-matteo',
      name: 'Wyss',
      firstName: 'Matteo',
    };
    const { user } = renderEditorForm(
      <LoadedView
        onSubmit={onSubmit}
        defaultValues={{ user: loaded }}
      />,
      { mocks: mocks() }
    );
    const search = () => picker(/^userConsents\.user\*/);

    expectTypeOf<
      z.output<typeof loadedSchema>['user']
    >().toEqualTypeOf<UserSearchValue>();
    expect((search() as HTMLInputElement).value).toBe('Matteo Wyss ');

    await user.click(search());
    await user.click(
      await screen.findByRole('option', { name: /^Anna Keller/ })
    );
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          user: expect.objectContaining({
            __typename: 'SensitiveDataUser',
            id: 'user-anna',
            email: 'user-anna@example.com',
          }),
        },
        expect.anything()
      )
    );
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(owner()).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(<View readOnly />, { mocks: mocks() });

    await user.click(owner());

    expect(owner()).toHaveAttribute('readonly');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(
      owner()
        .closest('.MuiAutocomplete-root')
        ?.querySelector('.MuiAutocomplete-popupIndicator')
    ).toBeNull();
  });
});
