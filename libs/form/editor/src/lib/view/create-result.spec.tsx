import { screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { z } from 'zod/v4';

import { drawerClosed, getFieldByLabel, renderFormRoutes } from '../../testing';
import { FormDrawer, FormDrawerPanel } from './form-drawer';
import { FormPage } from './form-page';
import { formView } from './form-view';
import { useCreateForm } from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
});

const generateView = formView(schema, {
  sections: [{ title: 'demo.details', fields: ['name'] }],
});

type Generate = (name: string) => Promise<string>;

function DemoGenerateForm({ generate }: { generate: Generate }) {
  const [secret, setSecret] = useState<string | null>(null);
  const demo = useCreateForm(generateView, {
    title: 'demo.titleGenerate',
    submitLabel: 'demo.generate',
    result: secret === null ? null : <p>secret {secret}</p>,
    save: async ({ name }) => {
      setSecret(await generate(name));

      return null;
    },
  });

  return <FormDrawerPanel controller={demo} />;
}

function DemoList({ generate }: { generate: Generate }) {
  const navigate = useNavigate();
  const open = useMatch('/demo/generate') !== null;

  return (
    <>
      <p>demo list</p>
      <FormDrawer
        open={open}
        onClose={() => navigate('/demo')}
      >
        <DemoGenerateForm generate={generate} />
      </FormDrawer>
    </>
  );
}

function DemoGeneratePage({ generate }: { generate: Generate }) {
  const [secret, setSecret] = useState<string | null>(null);
  const demo = useCreateForm(generateView, {
    title: 'demo.titleGenerate',
    submitLabel: 'demo.generate',
    result: secret === null ? null : <p>secret {secret}</p>,
    save: async ({ name }) => {
      setSecret(await generate(name));

      return null;
    },
  });

  return <FormPage controller={demo} />;
}

const generated: Generate = async name => `${name}-secret`;

const renderDrawer = (generate: Generate = generated) =>
  renderFormRoutes(
    { '/demo/*': <DemoList generate={generate} /> },
    { route: '/demo/generate' }
  );

describe('a create form with a result', () => {
  it('offers one submit button with its own label instead of Save and Save & close', () => {
    renderDrawer();

    const drawer = screen.getByRole('dialog', { name: 'demo.titleGenerate' });

    expect(within(drawer).getByTestId('saveButton')).toHaveTextContent(
      'demo.generate'
    );
    expect(within(drawer).getByTestId('saveButton')).toHaveAttribute(
      'type',
      'submit'
    );
    expect(
      within(drawer).queryByTestId('saveAndCloseButton')
    ).not.toBeInTheDocument();
  });

  it('validates like any create form', async () => {
    const generate = vi.fn(generated);
    const { user } = renderDrawer(generate);

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.name*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(generate).not.toHaveBeenCalled();
  });

  it('stays where it is after a save and shows the result in place of the sections', async () => {
    const { user, currentPath } = renderDrawer();

    await user.type(getFieldByLabel('demo.name*'), 'Import');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('secret Import-secret')).toBeInTheDocument();
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/generate');
    expect(
      screen.getByRole('dialog', { name: 'demo.titleGenerate' })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'demo.details' })
    ).not.toBeInTheDocument();
  });

  it('closes after the result without asking to discard', async () => {
    const { user, currentPath } = renderDrawer();

    await user.type(getFieldByLabel('demo.name*'), 'Import');
    await user.click(screen.getByTestId('saveButton'));
    await screen.findByText('secret Import-secret');
    await user.click(screen.getByRole('button', { name: 'close' }));

    await drawerClosed();
    expect(currentPath()).toBe('/demo');
    expect(
      screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).not.toBeInTheDocument();
  });

  it('keeps the form and its values when the save fails', async () => {
    const { user, currentPath } = renderDrawer(async () => {
      throw new Error('Generator offline');
    });

    await user.type(getFieldByLabel('demo.name*'), 'Import');
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('form.errors.server')).toBeInTheDocument();
    expect(getFieldByLabel('demo.name*')).toHaveValue('Import');
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/generate');
  });

  it('works on a page as well, without paths', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/generate': <DemoGeneratePage generate={generated} /> },
      { route: '/demo/generate' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Import');
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('secret Import-secret')).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/generate');
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
