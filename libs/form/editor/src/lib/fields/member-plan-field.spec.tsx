import { renderEditorForm } from '../../testing';
import { autocompleteOf, clearButtonOf } from '../../testing/autocomplete';
import {
  memberPlanFixture,
  memberPlanListMock,
} from '../../testing/picker-mocks';
import { screen, waitFor, within } from '@testing-library/react';
import type { FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');
const yearly = memberPlanFixture('plan-yearly', 'Jahresabo');
const donation = memberPlanFixture('plan-donation', 'Gönner');

const schema = z.object({
  memberPlanId: formFields.memberPlan().nullish().meta({
    label: 'discountCode.memberPlan',
    helperText: 'discountCode.memberPlanHelp',
  }),
  memberPlanIds: formFields
    .memberPlans()
    .min(1)
    .meta({ label: 'goodie.memberPlans' }),
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
        name="memberPlanId"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field
        name="memberPlanIds"
        disabled={disabled}
        readOnly={readOnly}
      />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const picker = (name: RegExp) => screen.getByRole('combobox', { name });

const memberPlan = () => picker(/^discountCode\.memberPlan/);
const memberPlans = () => picker(/^goodie\.memberPlans\*/);

const mocks = () => [memberPlanListMock([monthly, yearly, donation])];

describe('MemberPlanField and MemberPlansField', () => {
  it('label the pickers, mark a required one and explain them', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    expect(memberPlan()).not.toHaveAccessibleName(/\*/);
    expect(memberPlan()).not.toBeRequired();
    expect(memberPlan()).toHaveAccessibleDescription(
      'discountCode.memberPlanHelp'
    );
    expect(memberPlans()).toBeRequired();
  });

  it('submit the id of the picked plan and the ids of the picked plans', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(memberPlan());
    await user.click(await screen.findByRole('option', { name: 'Jahresabo' }));
    await user.click(memberPlans());
    await user.click(await screen.findByRole('option', { name: 'Monatsabo' }));
    await user.click(memberPlans());
    await user.click(await screen.findByRole('option', { name: 'Gönner' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          memberPlanId: 'plan-yearly',
          memberPlanIds: ['plan-monthly', 'plan-donation'],
        },
        expect.anything()
      )
    );
  });

  it('show the names of stored plans and submit the cleared values once cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          memberPlanId: 'plan-yearly',
          memberPlanIds: ['plan-monthly', 'plan-donation'],
        }}
      />,
      { mocks: mocks() }
    );

    await waitFor(() => expect(memberPlan()).toHaveValue('Jahresabo'));
    expect(
      within(autocompleteOf(memberPlans())).getByText('Gönner')
    ).toBeInTheDocument();

    await user.click(await clearButtonOf(user, memberPlan()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          memberPlanId: null,
          memberPlanIds: ['plan-monthly', 'plan-donation'],
        },
        expect.anything()
      )
    );
  });

  it('show the required error once an empty required plan list is left', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(memberPlans());
    await user.keyboard('{Escape}');
    await user.click(document.body);

    await waitFor(() =>
      expect(memberPlans()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(memberPlans()).toHaveAttribute('aria-invalid', 'true');
  });

  it('show the required error of a cleared required plan list', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ memberPlanIds: ['plan-monthly'] }}
      />,
      { mocks: mocks() }
    );

    await within(autocompleteOf(memberPlans())).findByText('Monatsabo');

    await user.click(await clearButtonOf(user, memberPlans()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(memberPlans()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(memberPlans()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(memberPlan()).toBeDisabled();
    expect(memberPlans()).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(<View readOnly />, { mocks: mocks() });

    await user.click(memberPlan());

    expect(memberPlan()).toHaveAttribute('readonly');
    expect(memberPlans()).toHaveAttribute('readonly');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
