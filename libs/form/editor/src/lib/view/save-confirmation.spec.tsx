import { screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod/v4';

import { getFieldByLabel, renderEditorForm } from '../../testing';
import { formView } from './form-view';
import { FormPage } from './form-page';
import {
  useSingletonForm,
  type FormChange,
  type SaveContext,
  type SaveConfirmation,
  type SingletonFormOptions,
} from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  days: z.int().min(1).max(365).meta({ label: 'demo.days' }),
  level: z
    .enum(['low', 'high'])
    .meta({ label: 'demo.level', optionLabelPrefix: 'demo.levels.' }),
  enabled: z.boolean().meta({ label: 'demo.enabled' }),
  secret: z.string().meta({ label: 'demo.secret' }),
});

type Values = z.output<typeof schema>;

const demoView = formView(schema, {
  sections: [
    { title: 'demo.general', fields: ['name', 'days', 'level'] },
    { title: 'demo.advanced', fields: ['enabled', 'secret'] },
  ],
  fields: { days: { props: { unit: 'form.units.days' } } },
});

const stored: Values = {
  name: 'Konzert',
  days: 30,
  level: 'low',
  enabled: false,
  secret: 'old',
};

const masked = () => '••••';

function ChangeCount({ changes }: { changes: readonly FormChange[] }) {
  return <p>{`${changes.length} changes`}</p>;
}

const confirmWithList: SaveConfirmation<typeof schema> = {
  title: 'demo.confirmTitle',
  description: 'demo.confirmBody',
  format: { secret: masked },
};

const confirmWithBody: SaveConfirmation<typeof schema> = {
  title: 'demo.confirmTitle',
  body: ChangeCount,
};

function SettingsView({
  save,
  confirm = confirmWithList,
  fields,
}: {
  save: (values: Values, context: SaveContext<typeof schema>) => unknown;
  confirm?: SaveConfirmation<typeof schema>;
  fields?: SingletonFormOptions<typeof schema>['fields'];
}) {
  const demo = useSingletonForm(demoView, {
    title: 'demo.settings',
    confirm,
    fields,
    load: async () => stored,
    save: async (values, context) => {
      await save(values, context);
    },
  });

  return <FormPage controller={demo} />;
}

const loaded = () =>
  waitFor(() => expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert'));

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: { form: { units: { days: 'days', days_one: 'day' } } },
    },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const hookUnit: SingletonFormOptions<typeof schema>['fields'] = {
  days: { props: { unit: 'form.units.minutes' } },
};

const changeRow = (dialog: HTMLElement, label: string) => {
  const value = within(dialog).getByText(label, { selector: 'dt' })
    .nextElementSibling as HTMLElement;

  return {
    before: value.querySelector('del')?.textContent,
    after: value.querySelector('ins')?.textContent,
  };
};

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

const change = async (user: ReturnType<typeof renderEditorForm>['user']) => {
  await user.clear(getFieldByLabel('demo.days*'));
  await user.type(getFieldByLabel('demo.days*'), '60');
  await user.click(screen.getByRole('combobox', { name: /^demo\.level/ }));
  await user.click(screen.getByRole('option', { name: 'demo.levels.high' }));
  await user.click(screen.getByRole('checkbox', { name: 'demo.enabled' }));
  await user.type(getFieldByLabel('demo.secret'), '-new');
};

describe('save confirmation', () => {
  it('blocks Save while the form is clean', async () => {
    renderEditorForm(<SettingsView save={vi.fn()} />);

    await loaded();

    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByTestId('saveButton')).toHaveAttribute('type', 'button');
  });

  it('shows the errors of an invalid form instead of the dialog', async () => {
    const save = vi.fn();
    const { user } = renderEditorForm(<SettingsView save={save} />);

    await loaded();
    await user.clear(getFieldByLabel('demo.name*'));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.name*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(getFieldByLabel('demo.name*')).toHaveFocus();
  });

  it('lists every change with its label, the old and the new value', async () => {
    const { user } = renderEditorForm(<SettingsView save={vi.fn()} />);

    await loaded();
    await change(user);
    await user.click(screen.getByTestId('saveButton'));

    const dialog = await screen.findByRole('dialog', {
      name: 'demo.confirmTitle',
    });

    expect(within(dialog).getByText('demo.confirmBody')).toBeInTheDocument();
    expect(changeRow(dialog, 'demo.days')).toEqual({
      before: '30 form.units.days',
      after: '60 form.units.days',
    });
    expect(changeRow(dialog, 'demo.level')).toEqual({
      before: 'demo.levels.low',
      after: 'demo.levels.high',
    });
    expect(changeRow(dialog, 'demo.enabled')).toEqual({
      before: 'form.value.off',
      after: 'form.value.on',
    });
    expect(changeRow(dialog, 'demo.secret')).toEqual({
      before: '••••',
      after: '••••',
    });
    expect(within(dialog).queryByText('demo.name')).not.toBeInTheDocument();
  });

  it('names a single unit in the singular', async () => {
    const { user } = renderEditorForm(
      <Translated>
        <SettingsView save={vi.fn()} />
      </Translated>
    );

    await loaded();
    await user.clear(getFieldByLabel('demo.days*'));
    await user.type(getFieldByLabel('demo.days*'), '1');
    await user.click(screen.getByTestId('saveButton'));

    expect(changeRow(await screen.findByRole('dialog'), 'demo.days')).toEqual({
      before: '30 days',
      after: '1 day',
    });
  });

  it('takes the unit from the fields the hook passes', async () => {
    const { user } = renderEditorForm(
      <SettingsView
        save={vi.fn()}
        fields={hookUnit}
      />
    );

    await loaded();
    await user.clear(getFieldByLabel('demo.days*'));
    await user.type(getFieldByLabel('demo.days*'), '60');
    await user.click(screen.getByTestId('saveButton'));

    expect(changeRow(await screen.findByRole('dialog'), 'demo.days')).toEqual({
      before: '30 form.units.minutes',
      after: '60 form.units.minutes',
    });
  });

  it('keeps the form dirty and saves nothing when Escape dismisses the dialog', async () => {
    const save = vi.fn();
    const { user } = renderEditorForm(<SettingsView save={save} />);

    await loaded();
    await change(user);
    await user.click(screen.getByTestId('saveButton'));
    await screen.findByRole('dialog', { name: 'demo.confirmTitle' });
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(save).not.toHaveBeenCalled();
    expect(getFieldByLabel('demo.days*')).toHaveValue(60);
    expect(leavePage()).toBe(true);
  });

  it('keeps the form dirty and saves nothing on Cancel', async () => {
    const save = vi.fn();
    const { user } = renderEditorForm(<SettingsView save={save} />);

    await loaded();
    await change(user);
    await user.click(screen.getByTestId('saveButton'));
    await user.click(await screen.findByRole('button', { name: 'cancel' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(save).not.toHaveBeenCalled();
    expect(getFieldByLabel('demo.days*')).toHaveValue(60);
    expect(leavePage()).toBe(true);
  });

  it('saves with the save intent on Confirm and closes the dialog', async () => {
    const save = vi.fn();
    const { user } = renderEditorForm(<SettingsView save={save} />);

    await loaded();
    await change(user);
    await user.click(screen.getByTestId('saveButton'));
    await user.click(await screen.findByTestId('confirmSaveButton'));

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(
      {
        name: 'Konzert',
        days: 60,
        level: 'high',
        enabled: true,
        secret: 'old-new',
      },
      expect.objectContaining({
        intent: 'save',
        changedKeys: ['days', 'level', 'enabled', 'secret'],
      })
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
  });

  it('never submits through Enter in a field', async () => {
    const save = vi.fn();
    const { user } = renderEditorForm(<SettingsView save={save} />);

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live{Enter}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('hands the changes to a custom body', async () => {
    const { user } = renderEditorForm(
      <SettingsView
        save={vi.fn()}
        confirm={confirmWithBody}
      />
    );

    await loaded();
    await change(user);
    await user.click(screen.getByTestId('saveButton'));

    expect(
      within(await screen.findByRole('dialog')).getByText('4 changes')
    ).toBeInTheDocument();
  });

  it('leaves space between the description and the changes', async () => {
    const { user } = renderEditorForm(<SettingsView save={vi.fn()} />);

    await loaded();
    await change(user);
    await user.click(screen.getByTestId('saveButton'));

    const description = within(
      await screen.findByRole('dialog', { name: 'demo.confirmTitle' })
    ).getByText('demo.confirmBody');

    expect(getComputedStyle(description).marginBottom).not.toMatch(/^(0px)?$/);
  });
});
