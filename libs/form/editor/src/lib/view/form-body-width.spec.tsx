import { screen } from '@testing-library/react';
import { z } from 'zod/v4';

import { renderEditorForm } from '../../testing';
import { FormPage } from './form-page';
import { formView } from './form-view';
import { useCreateForm, useEditForm } from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
});

function Stats() {
  return <p>demo.stats</p>;
}

const view = formView(schema, {
  paths: { list: '/demo', edit: (id: string) => `/demo/edit/${id}` },
  sections: [
    { title: 'demo.details', fields: ['name'] },
    {
      title: 'demo.stats',
      placement: 'aside',
      modes: ['edit'],
      component: Stats,
    },
  ],
});

function CreatePage() {
  const demo = useCreateForm(view, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

function EditPage() {
  const demo = useEditForm(view, {
    title: 'demo.titleEdit',
    load: async () => ({ name: 'Konzert' }),
    save: async () => undefined,
  });

  return <FormPage controller={demo} />;
}

const bodyOf = (region: HTMLElement) =>
  region.parentElement?.parentElement?.parentElement as HTMLElement;

describe('the body width of a view with an aside for one mode', () => {
  it('stays narrow in the modes that render no aside', () => {
    renderEditorForm(<CreatePage />);

    const details = screen.getByRole('region', { name: 'demo.details' });

    expect(
      screen.queryByRole('region', { name: 'demo.stats' })
    ).not.toBeInTheDocument();
    expect(getComputedStyle(bodyOf(details)).maxWidth).toBe('760px');
  });

  it('widens in the mode that renders the aside', async () => {
    renderEditorForm(<EditPage />);

    const details = await screen.findByRole('region', { name: 'demo.details' });

    expect(
      screen.getByRole('region', { name: 'demo.stats' })
    ).toBeInTheDocument();
    expect(getComputedStyle(bodyOf(details)).maxWidth).toBe('1200px');
  });
});
