import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';

const schema = z.object({
  title: z.string().min(1).meta({
    label: 'event.title',
    description: 'event.titleInfo',
    helperText: 'event.titleHelp',
    placeholder: 'event.titlePlaceholder',
  }),
  email: z.email().or(z.literal('')).meta({ label: 'user.email' }),
  website: z.url().optional().meta({ label: 'user.website' }),
  password: z.string().optional().meta({ label: 'user.password' }),
  name: z.string().default('Unbenannt').meta({ label: 'event.name' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  disabled,
  readOnly,
  hideLabel,
  endAdornment,
}: {
  onSubmit?: (values: Values) => unknown;
  disabled?: boolean;
  readOnly?: boolean;
  hideLabel?: boolean;
  endAdornment?: ReactNode;
}) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="title"
        disabled={disabled}
        readOnly={readOnly}
        hideLabel={hideLabel}
        props={{ endAdornment }}
      />
      <Field name="email" />
      <Field name="website" />
      <Field
        name="password"
        props={{ type: 'password' }}
      />
      <Field name="name" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('TextField', () => {
  it('labels the input, marks it as required and explains it in a tooltip', () => {
    renderEditorForm(<View />);

    const title = getFieldByLabel('event.title*');

    expect(title).toHaveAttribute('placeholder', 'event.titlePlaceholder');
    expect(title).toBeRequired();
    expect(
      screen.getByRole('button', { name: 'event.titleInfo' })
    ).toBeInTheDocument();
    expect(screen.getByText('event.titleHelp')).toBeInTheDocument();
    expect(title).toHaveAccessibleDescription('event.titleHelp');
    expect(getFieldByLabel('user.website')).not.toBeRequired();
  });

  it('names the input by its label alone and keeps the tooltip out of the outline', () => {
    renderEditorForm(<View />);

    const title = screen.getByRole('textbox', { name: 'event.title*' });
    const outline = title
      .closest('.MuiFormControl-root')
      ?.querySelector('fieldset');

    expect(outline).toHaveAttribute('aria-hidden', 'true');
    expect(outline?.querySelectorAll('button, [tabindex]')).toHaveLength(0);
    expect(outline).toHaveTextContent(/^event\.title/);
  });

  it('names the tooltip of a description that is not plain text', () => {
    function DescribedView() {
      const handle = editorForm.useSchemaForm(schema);

      return (
        <editorForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <Field
            name="email"
            description={<strong>Wird nie angezeigt</strong>}
          />
        </editorForm.Form>
      );
    }

    renderEditorForm(<DescribedView />);

    expect(
      screen.getByRole('button', { name: 'form.field.moreInfo' })
    ).toBeInTheDocument();
  });

  it('shows the translated error in place of the helper text once the field was left', async () => {
    const { user } = renderEditorForm(<View />);
    const title = getFieldByLabel('event.title*');

    await user.click(title);

    expect(screen.queryByText('form.errors.required')).not.toBeInTheDocument();

    await user.tab();

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(screen.queryByText('event.titleHelp')).not.toBeInTheDocument();
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveAccessibleDescription('form.errors.required');
  });

  it('picks the input type from the schema format', () => {
    renderEditorForm(<View />);

    expect(getFieldByLabel('user.email')).toHaveAttribute('type', 'email');
    expect(getFieldByLabel('user.website')).toHaveAttribute('type', 'url');
    expect(getFieldByLabel('event.title*')).toHaveAttribute('type', 'text');
  });

  it('hides a password until asked to show it', async () => {
    const { user } = renderEditorForm(<View />);
    const password = getFieldByLabel('user.password');

    expect(password).toHaveAttribute('type', 'password');

    await user.click(
      screen.getByRole('button', { name: 'form.password.show' })
    );

    expect(password).toHaveAttribute('type', 'text');

    await user.click(
      screen.getByRole('button', { name: 'form.password.hide' })
    );

    expect(password).toHaveAttribute('type', 'password');
  });

  it('shows an end adornment inside the input and announces it with the value', () => {
    renderEditorForm(<View endAdornment={<span>12 Stimmen</span>} />);

    const title = getFieldByLabel('event.title*');

    expect(title.parentElement).toHaveTextContent('12 Stimmen');
    expect(title).toHaveAccessibleDescription('12 Stimmen event.titleHelp');
  });

  it('turns a cleared field with a default into a required one', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);
    const name = getFieldByLabel('event.name*');

    expect(name).toHaveValue('Unbenannt');

    await user.clear(name);
    await user.type(getFieldByLabel('event.title*'), 'Konzert');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a cleared optional field as empty instead of as an invalid empty text', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(getFieldByLabel('event.title*'), 'Konzert');
    await user.type(getFieldByLabel('user.website'), 'x');
    await user.clear(getFieldByLabel('user.website'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          title: 'Konzert',
          email: '',
          website: undefined,
          password: '',
          name: 'Unbenannt',
        },
        expect.anything()
      )
    );
  });

  it('can be disabled or read only', () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(getFieldByLabel('event.title*')).toBeDisabled();

    unmount();
    renderEditorForm(<View readOnly />);

    expect(getFieldByLabel('event.title*')).toHaveAttribute('readonly');
    expect(getFieldByLabel('event.title*')).toBeEnabled();
  });

  it('keeps an accessible name when the label is hidden', () => {
    const { container } = renderEditorForm(<View hideLabel />);

    expect(
      screen.getByRole('textbox', { name: 'event.title' })
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        `label[for="${screen.getByRole('textbox', { name: 'event.title' }).id}"]`
      )
    ).toBeNull();
  });
});
