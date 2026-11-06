import { screen, waitFor } from '@testing-library/react';
import { z } from 'zod/v4';

import { getFieldByLabel, renderFormRoutes } from '../../testing';
import { formView } from './form-view';
import { FormPage } from './form-page';
import { cancelSave } from './save-cancelled';
import { useCreateForm } from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
});

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [{ title: 'demo.details', fields: ['name'] }],
});

function CreateView({ save }: { save: () => Promise<string | undefined> }) {
  const demo = useCreateForm(demoView, { title: 'demo.titleCreate', save });

  return <FormPage controller={demo} />;
}

describe('cancelSave', () => {
  it('stops a save without a toast, an error or navigation', async () => {
    const save = vi.fn(async () => cancelSave());
    const { user, currentPath } = renderFormRoutes(
      { '/demo/create': <CreateView save={save} /> },
      { route: '/demo/create' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('saveButton')).toBeEnabled());
    expect(currentPath()).toBe('/demo/create');
    expect(screen.queryByText('toast.createdSuccess')).not.toBeInTheDocument();
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert');
  });

  it('still reports any other error', async () => {
    const save = vi.fn(async (): Promise<string> => {
      throw new Error('boom');
    });

    const { user } = renderFormRoutes(
      { '/demo/create': <CreateView save={save} /> },
      { route: '/demo/create' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('form.errors.server')).toBeInTheDocument();
  });
});
