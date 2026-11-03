import { renderEditorForm } from '../../testing';
import { clearButtonOf } from '../../testing/autocomplete';
import { paywallFixture, paywallListMock } from '../../testing/picker-mocks';
import { screen, waitFor } from '@testing-library/react';
import type { FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const standard = paywallFixture('paywall-standard', 'Standard');
const premium = paywallFixture('paywall-premium', 'Premium');

const schema = z.object({
  newArticlePaywall: formFields.paywall().nullish().meta({
    label: 'settings.newArticlePaywall',
    helperText: 'settings.newArticlePaywallHelp',
  }),
  fallbackPaywall: formFields
    .paywall()
    .meta({ label: 'settings.fallbackPaywall' }),
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
        name="newArticlePaywall"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="fallbackPaywall" />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const picker = (name: RegExp) => screen.getByRole('combobox', { name });

const newArticlePaywall = () => picker(/^settings\.newArticlePaywall/);
const fallbackPaywall = () => picker(/^settings\.fallbackPaywall\*/);

const mocks = () => [paywallListMock([standard, premium])];

describe('PaywallField', () => {
  it('labels the picker, marks a required one and explains it', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    expect(newArticlePaywall()).not.toHaveAccessibleName(/\*/);
    expect(newArticlePaywall()).not.toBeRequired();
    expect(newArticlePaywall()).toHaveAccessibleDescription(
      'settings.newArticlePaywallHelp'
    );
    expect(fallbackPaywall()).toBeRequired();
  });

  it('submits the ids of the picked paywalls', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(newArticlePaywall());
    await user.click(await screen.findByRole('option', { name: 'Premium' }));
    await user.click(fallbackPaywall());
    await user.click(await screen.findByRole('option', { name: 'Standard' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          newArticlePaywall: 'paywall-premium',
          fallbackPaywall: 'paywall-standard',
        },
        expect.anything()
      )
    );
  });

  it('shows the name of a stored paywall and submits null once cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          newArticlePaywall: 'paywall-premium',
          fallbackPaywall: 'paywall-standard',
        }}
      />,
      { mocks: mocks() }
    );

    await waitFor(() => expect(newArticlePaywall()).toHaveValue('Premium'));

    await user.click(await clearButtonOf(user, newArticlePaywall()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { newArticlePaywall: null, fallbackPaywall: 'paywall-standard' },
        expect.anything()
      )
    );
  });

  it('shows the required error once an empty required picker is left', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(fallbackPaywall());
    await user.keyboard('{Escape}');
    await user.click(document.body);

    await waitFor(() =>
      expect(fallbackPaywall()).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
    expect(fallbackPaywall()).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the required error of an empty required picker on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(fallbackPaywall()).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
    expect(fallbackPaywall()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(newArticlePaywall()).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(<View readOnly />, { mocks: mocks() });

    await user.click(newArticlePaywall());

    expect(newArticlePaywall()).toHaveAttribute('readonly');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
