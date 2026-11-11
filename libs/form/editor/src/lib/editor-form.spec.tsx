import {
  getFieldByLabel,
  queryFieldByLabel,
  renderEditorForm,
} from '../testing';
import { screen, waitFor, within } from '@testing-library/react';
import { LoadState } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm, type SubmitContext } from './editor-form';

const schema = z.object({
  title: z.string().min(1).meta({ label: 'event.title' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

type ViewProps = {
  load?: () => Promise<Partial<Values>>;
  onSubmit?: (values: Values) => unknown;
  warnOnUnsavedChanges?: boolean;
};

function View({ load, onSubmit = vi.fn(), warnOnUnsavedChanges }: ViewProps) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: load ?? { title: '' },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
      warnOnUnsavedChanges={warnOnUnsavedChanges}
    >
      <LoadState />
      <Field name="title" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

describe('editorForm', () => {
  it('renders a form element with the editor fields and translated labels', () => {
    const { container } = renderEditorForm(<View />);

    expect(container.querySelector('form')).toHaveAttribute('novalidate');
    expect(getFieldByLabel('event.title*')).toBeInTheDocument();
  });

  it('shows a progress indicator while the values load', async () => {
    let resolve: (values: Partial<Values>) => void = () => undefined;

    renderEditorForm(
      <View load={() => new Promise(done => (resolve = done))} />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(queryFieldByLabel('event.title*')).not.toBeInTheDocument();

    resolve({ title: 'Konzert' });

    expect(await screen.findByLabelText('event.title*')).toHaveValue('Konzert');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('reports a failed load in place of the fields and as a toast', async () => {
    renderEditorForm(
      <View load={() => Promise.reject(new Error('Server down'))} />
    );

    const alert = await screen.findByText('form.loadError.title');

    expect(
      within(alert.closest('[role="alert"]') as HTMLElement).getByText(
        'Server down'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'form.loadError.retry' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel('event.title*')).not.toBeInTheDocument();
    expect(screen.getAllByText('Server down')).toHaveLength(2);
  });

  it('loads again in place when retry is clicked', async () => {
    const load = vi
      .fn<() => Promise<Partial<Values>>>()
      .mockRejectedValueOnce(new Error('Server down'))
      .mockResolvedValueOnce({ title: 'Konzert' });
    const { user } = renderEditorForm(<View load={load} />);

    await user.click(
      await screen.findByRole('button', { name: 'form.loadError.retry' })
    );

    expect(await screen.findByLabelText('event.title*')).toHaveValue('Konzert');
    expect(screen.queryByText('form.loadError.title')).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('declares the intents of the SingleViewTitle buttons', async () => {
    type Context = Parameters<
      Parameters<typeof editorForm.Form>[0]['onSubmit']
    >[1];

    expectTypeOf<Context['intent']>().toEqualTypeOf<
      'save' | 'close' | undefined
    >();
    expectTypeOf<SubmitContext['intent']>().toEqualTypeOf<
      'save' | 'close' | undefined
    >();

    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(getFieldByLabel('event.title*'), 'Konzert');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('shows a toast when saving fails', async () => {
    const { user } = renderEditorForm(
      <View onSubmit={() => Promise.reject(new Error('Mutation failed'))} />
    );

    await user.type(getFieldByLabel('event.title*'), 'Konzert');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('Mutation failed')).toBeInTheDocument();
  });

  it('warns before leaving the page with unsaved changes', async () => {
    const { user, unmount } = renderEditorForm(<View />);

    expect(leavePage()).toBe(false);

    await user.type(getFieldByLabel('event.title*'), 'Konzert');

    await waitFor(() => expect(leavePage()).toBe(true));

    unmount();
  });

  it('does not warn when the form opts out', async () => {
    const { user, unmount } = renderEditorForm(
      <View warnOnUnsavedChanges={false} />
    );

    await user.type(getFieldByLabel('event.title*'), 'Konzert');

    expect(leavePage()).toBe(false);

    unmount();
  });

  it('stops warning once the changes are saved', async () => {
    const onSubmit = vi.fn();
    const { user, unmount } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(getFieldByLabel('event.title*'), 'Konzert');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { title: 'Konzert' },
        expect.anything()
      )
    );
    await waitFor(() => expect(leavePage()).toBe(false));

    unmount();
  });
});
