import { renderEditorForm, stubSortableRowRects } from '../../testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  bindComponent,
  useField,
  withKind,
  type FormDefaultValues,
} from '@wepublish/form/core';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod/v4';

import * as formEditor from '../../index';
import { components } from '../components';
import { editorForm } from '../editor-form';
import { FormErrorSummary } from '../form-error-summary';
import { ArrayField, type ArrayFieldProps } from './array-field';

const actionSchema = z.object({
  label: z.string().min(1).meta({ label: 'banner.form.actionLabel' }),
  url: z.string().meta({ label: 'banner.form.actionUrl' }),
});

const linkType = z.literal('page').meta({
  label: 'navigation.linkType',
  optionLabelPrefix: 'navigation.linkType.',
});

const linkSchema = z.discriminatedUnion('type', [
  z.object({
    type: linkType,
    label: z.string().meta({ label: 'navigation.linkLabel' }),
    pageId: z.string().min(1).meta({ label: 'navigation.page' }),
  }),
  z.object({
    type: z.literal('external'),
    label: z.string().meta({ label: 'navigation.linkLabel' }),
    url: z.string().min(1).meta({ label: 'navigation.url' }),
  }),
]);

const schema = z.object({
  actions: z.array(actionSchema).min(1).max(3).meta({
    label: 'banner.form.actions',
    helperText: 'banner.form.actionsHelp',
  }),
  links: z.array(linkSchema).meta({ label: 'navigation.links' }),
  pages: z
    .array(withKind(z.string().min(1), 'page').meta({ label: 'page.select' }))
    .meta({ label: 'navigation.pages' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

const loaded = {
  actions: [
    { label: 'Mehr lesen', url: '/mehr' },
    { label: 'Abo', url: '/abo' },
  ],
  links: [],
  pages: [],
};

function PagePicker() {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <select
      ref={ref}
      aria-label={`picker ${field.name}`}
      value={field.value ?? ''}
      onChange={event => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    >
      <option value="">-</option>
      <option value="home">home</option>
      <option value="about">about</option>
    </select>
  );
}

function View({
  onSubmit = vi.fn(),
  defaultValues = loaded,
  disabled,
  readOnly,
  ...props
}: ArrayFieldProps & {
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
      fields={{ 'pages.*': { component: bindComponent(PagePicker) } }}
    >
      <FormErrorSummary />
      <Field
        name="actions"
        props={props}
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field
        name="links"
        props={props}
      />
      <Field name="pages" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const describedSchema = z.object({
  actions: z
    .array(
      z.object({
        label: z.string().meta({ label: 'banner.form.action.label' }),
        style: z.string().meta({
          label: 'banner.form.action.style',
          description: 'banner.form.action.styleInfo',
        }),
      })
    )
    .meta({ label: 'banner.form.actions' }),
});

const Described = editorForm.fieldsFor(describedSchema);

function DescribedTableView() {
  const handle = editorForm.useSchemaForm(describedSchema, {
    defaultValues: { actions: [{ label: 'Abo', style: 'outline' }] },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={vi.fn()}
    >
      <Described.Field
        name="actions"
        props={{ variant: 'table' }}
      />
    </editorForm.Form>
  );
}

const actionsGroup = () =>
  screen.getByRole('group', { name: /^banner\.form\.actions\*/ });

const rowsOf = (group: HTMLElement) => within(group).queryAllByRole('listitem');

const actionLabelIn = (row: HTMLElement) =>
  within(row).getByRole('textbox', { name: /^banner\.form\.actionLabel/ });

const submitted = (onSubmit: ReturnType<typeof vi.fn>) =>
  onSubmit.mock.calls[0][0] as Values;

describe('ArrayField', () => {
  it('is the component of the array kind and exported from the package', () => {
    expect(components.array).toBe(ArrayField);
    expect(formEditor.ArrayField).toBe(ArrayField);
  });

  it('renders each item through the element component inside a titled, described list', () => {
    renderEditorForm(<View />);

    const group = actionsGroup();
    const rows = rowsOf(group);

    expect(
      within(group).getByRole('heading', {
        level: 3,
        name: /^banner\.form\.actions\*/,
      })
    ).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('banner.form.actionsHelp');
    expect(rows).toHaveLength(2);
    expect(actionLabelIn(rows[0])).toHaveValue('Mehr lesen');
    expect(
      within(rows[1]).getByRole('textbox', { name: 'banner.form.actionUrl' })
    ).toHaveValue('/abo');
  });

  it('appends an empty item, focuses it and submits the items in order', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(
      within(actionsGroup()).getByRole('button', { name: 'form.array.add' })
    );

    const rows = rowsOf(actionsGroup());

    expect(rows).toHaveLength(3);
    await waitFor(() => expect(actionLabelIn(rows[2])).toHaveFocus());
    expect(actionLabelIn(rows[2])).toHaveValue('');

    await user.type(actionLabelIn(rows[2]), 'Spenden');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).actions).toEqual([
      { label: 'Mehr lesen', url: '/mehr' },
      { label: 'Abo', url: '/abo' },
      { label: 'Spenden', url: '' },
    ]);
  });

  it('removes an item and moves the focus to the remove button of the next one', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(
      within(rowsOf(actionsGroup())[0]).getByRole('button', {
        name: 'form.array.remove',
      })
    );

    expect(rowsOf(actionsGroup())).toHaveLength(1);
    expect(
      within(rowsOf(actionsGroup())[0]).getByRole('button', {
        name: 'form.array.remove',
      })
    ).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).actions).toEqual([
      { label: 'Abo', url: '/abo' },
    ]);
  });

  it('moves the focus to the previous row and then to the add button as the last rows go', async () => {
    const { user } = renderEditorForm(<View />);
    const removeIn = (row: HTMLElement) =>
      within(row).getByRole('button', { name: 'form.array.remove' });

    await user.click(removeIn(rowsOf(actionsGroup())[1]));

    expect(removeIn(rowsOf(actionsGroup())[0])).toHaveFocus();

    await user.click(removeIn(rowsOf(actionsGroup())[0]));

    expect(
      within(actionsGroup()).getByRole('button', { name: 'form.array.add' })
    ).toHaveFocus();
  });

  it('enables the add button again after removing from a full list', async () => {
    const { user } = renderEditorForm(
      <View
        defaultValues={{
          ...loaded,
          actions: [...loaded.actions, { label: 'Spenden', url: '/spenden' }],
        }}
      />
    );
    const add = within(actionsGroup()).getByRole('button', {
      name: 'form.array.add',
    });

    expect(add).toBeDisabled();

    await user.click(
      within(rowsOf(actionsGroup())[0]).getByRole('button', {
        name: 'form.array.remove',
      })
    );

    expect(add).toBeEnabled();
  });

  it('offers a drag handle per row unless sorting is turned off, and no move buttons', () => {
    const { unmount } = renderEditorForm(<View sortable={false} />);

    expect(
      within(actionsGroup()).queryByRole('button', {
        name: 'form.array.dragHandle',
      })
    ).not.toBeInTheDocument();

    unmount();

    renderEditorForm(<View sortable />);

    const rows = rowsOf(actionsGroup());

    expect(
      within(rows[0]).getByRole('button', { name: 'form.array.dragHandle' })
    ).toHaveAttribute('aria-roledescription', 'form.array.roleDescription');
    expect(
      within(rows[1]).getByRole('button', { name: 'form.array.dragHandle' })
    ).toBeInTheDocument();
    expect(
      within(actionsGroup()).queryByRole('button', {
        name: /^form\.array\.move/,
      })
    ).not.toBeInTheDocument();
  });

  it('reorders rows from the keyboard through the drag handle', async () => {
    const rects = stubSortableRowRects();
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        sortable
      />
    );

    within(rowsOf(actionsGroup())[0])
      .getByRole('button', { name: 'form.array.dragHandle' })
      .focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[Space]');

    await waitFor(() =>
      expect(actionLabelIn(rowsOf(actionsGroup())[0])).toHaveValue('Abo')
    );

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).actions.map(action => action.label)).toEqual([
      'Abo',
      'Mehr lesen',
    ]);

    rects.mockRestore();
  });

  it('keeps the order when a keyboard drag is cancelled', async () => {
    const rects = stubSortableRowRects();
    const { user } = renderEditorForm(<View sortable />);

    within(rowsOf(actionsGroup())[0])
      .getByRole('button', { name: 'form.array.dragHandle' })
      .focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[Escape]');

    expect(actionLabelIn(rowsOf(actionsGroup())[0])).toHaveValue('Mehr lesen');

    rects.mockRestore();
  });

  it('names the row buttons by position and announces a keyboard drag', async () => {
    const rects = stubSortableRowRects();
    const i18n = i18next.createInstance();

    await i18n.init({
      lng: 'en',
      resources: {
        en: {
          translation: {
            form: {
              array: {
                add: 'Add entry',
                remove: 'Remove entry {{position}}',
                dragHandle: 'Reorder entry {{position}}',
                roleDescription: 'sortable entry',
                dragInstructions: 'Press Space to pick up an entry.',
                dragStart: 'Picked up entry {{position}}.',
                dragOver: 'Entry {{position}} is over position {{target}}.',
                dragEnd: 'Entry {{position}} dropped at position {{target}}.',
                dragCancel: 'Entry {{position}} is back in its place.',
              },
            },
          },
        },
      },
    });

    const { user } = renderEditorForm(
      <I18nextProvider i18n={i18n}>
        <View sortable />
      </I18nextProvider>
    );

    const announcements = () =>
      screen
        .getAllByRole('status')
        .map(region => region.textContent)
        .join(' ');
    const group = actionsGroup();
    const handle = within(group).getByRole('button', {
      name: 'Reorder entry 1',
    });

    expect(
      within(group).getByRole('button', { name: 'Remove entry 2' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('button', { name: 'Reorder entry 2' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('button', { name: 'Add entry' })
    ).toBeInTheDocument();
    expect(handle).toHaveAttribute('aria-roledescription', 'sortable entry');
    expect(handle).toHaveAccessibleDescription(
      'Press Space to pick up an entry.'
    );

    handle.focus();
    await user.keyboard('[Space]');

    await waitFor(() =>
      expect(announcements()).toContain('Picked up entry 1.')
    );

    await user.keyboard('[ArrowDown]');

    await waitFor(() =>
      expect(announcements()).toContain('Entry 1 is over position 2.')
    );

    await user.keyboard('[Space]');

    await waitFor(() =>
      expect(announcements()).toContain('Entry 1 dropped at position 2.')
    );

    rects.mockRestore();
  });

  it('shows the rows without a box around each item and a text add button', () => {
    renderEditorForm(<View sortable />);

    const [first, second] = rowsOf(actionsGroup());

    expect(getComputedStyle(first).borderLeftStyle).not.toBe('solid');
    expect(getComputedStyle(second).borderLeftStyle).not.toBe('solid');
    expect(getComputedStyle(first).borderTopStyle).not.toBe('solid');
    expect(getComputedStyle(second).borderTopStyle).toBe('solid');
    expect(
      within(actionsGroup()).getByRole('button', { name: 'form.array.add' })
    ).toHaveClass('MuiButton-text');
  });

  it('uses the given add label and shows an empty state', () => {
    renderEditorForm(
      <View
        addLabel="banner.form.addAction"
        defaultValues={{ actions: [], links: [], pages: [] }}
      />
    );

    const group = actionsGroup();

    expect(rowsOf(group)).toHaveLength(0);
    expect(within(group).getByText('form.array.empty')).toBeInTheDocument();
    expect(
      within(group).getByRole('button', { name: 'banner.form.addAction' })
    ).toBeInTheDocument();
  });

  it('takes an add label that is already translated', () => {
    renderEditorForm(<View addLabel={<span>Aktion hinzufügen</span>} />);

    expect(
      within(actionsGroup()).getByRole('button', { name: 'Aktion hinzufügen' })
    ).toBeInTheDocument();
  });

  it('shows item errors in their row and the array error at the list', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.clear(actionLabelIn(rowsOf(actionsGroup())[0]));
    await user.click(screen.getByRole('button', { name: 'save' }));

    const firstRow = rowsOf(actionsGroup())[0];

    expect(
      await within(firstRow).findByText('form.errors.required')
    ).toBeInTheDocument();
    expect(actionLabelIn(firstRow)).toHaveAttribute('aria-invalid', 'true');

    await user.click(
      within(firstRow).getByRole('button', { name: 'form.array.remove' })
    );
    await user.click(
      within(actionsGroup()).getByRole('button', { name: 'form.array.remove' })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(actionsGroup()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stops adding at the maximum number of items', async () => {
    const { user } = renderEditorForm(<View />);
    const add = within(actionsGroup()).getByRole('button', {
      name: 'form.array.add',
    });

    await user.click(add);

    expect(rowsOf(actionsGroup())).toHaveLength(3);
    expect(add).toBeDisabled();
  });

  it('hides the row controls when read only and disables them when disabled', () => {
    const { unmount } = renderEditorForm(
      <View
        readOnly
        sortable
      />
    );

    expect(
      within(actionsGroup()).queryByRole('button')
    ).not.toBeInTheDocument();
    expect(actionLabelIn(rowsOf(actionsGroup())[0])).toHaveAttribute(
      'readonly'
    );

    unmount();

    renderEditorForm(
      <View
        disabled
        sortable
      />
    );

    for (const button of within(actionsGroup()).getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
    expect(actionLabelIn(rowsOf(actionsGroup())[0])).toBeDisabled();
  });

  describe('as a table', () => {
    const table = () =>
      screen.getByRole('table', { name: /^banner\.form\.actions\*/ });

    it('renders the item labels once as column headers and the cells without labels', () => {
      renderEditorForm(<View variant="table" />);

      expect(
        within(table())
          .getAllByRole('columnheader')
          .map(header => header.textContent)
      ).toEqual([
        'form.array.reorder',
        'banner.form.actionLabel',
        'banner.form.actionUrl',
        'form.array.actions',
      ]);
      expect(within(table()).getAllByRole('row')).toHaveLength(3);
      expect(
        within(table()).getAllByRole('textbox', {
          name: 'banner.form.actionLabel',
        })[1]
      ).toHaveValue('Abo');
      expect(
        within(table()).queryByText(/^banner\.form\.actionLabel\*/)
      ).not.toBeInTheDocument();
    });

    it('explains a column in its header when the item key has a description', () => {
      renderEditorForm(<DescribedTableView />);

      const [, label, style] = within(
        screen.getByRole('table', { name: 'banner.form.actions' })
      ).getAllByRole('columnheader');

      expect(style).toHaveTextContent('banner.form.action.style');
      expect(
        within(style).getByRole('button', {
          name: 'banner.form.action.styleInfo',
        })
      ).toBeInTheDocument();
      expect(within(label).queryByRole('button')).not.toBeInTheDocument();
    });

    it('edits, adds and removes rows', async () => {
      const rects = stubSortableRowRects();
      const onSubmit = vi.fn();
      const { user } = renderEditorForm(
        <View
          onSubmit={onSubmit}
          variant="table"
          sortable
        />
      );

      await user.click(
        within(actionsGroup()).getByRole('button', { name: 'form.array.add' })
      );

      const rows = within(table()).getAllByRole('row').slice(1);

      await user.type(
        within(rows[2]).getByRole('textbox', {
          name: 'banner.form.actionLabel',
        }),
        'Spenden'
      );
      await user.click(
        within(rows[0]).getByRole('button', { name: 'form.array.remove' })
      );
      within(within(table()).getAllByRole('row')[2])
        .getByRole('button', { name: 'form.array.dragHandle' })
        .focus();
      await user.keyboard('[Space]');
      await user.keyboard('[ArrowUp]');
      await user.keyboard('[Space]');
      await waitFor(() =>
        expect(
          within(within(table()).getAllByRole('row')[1]).getByRole('textbox', {
            name: 'banner.form.actionLabel',
          })
        ).toHaveValue('Spenden')
      );
      await user.click(screen.getByRole('button', { name: 'save' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(submitted(onSubmit).actions).toEqual([
        { label: 'Spenden', url: '' },
        { label: 'Abo', url: '/abo' },
      ]);

      rects.mockRestore();
    });

    it('shows cell errors in the cell', async () => {
      const { user } = renderEditorForm(<View variant="table" />);
      const cell = within(table()).getAllByRole('textbox', {
        name: 'banner.form.actionLabel',
      })[0];

      await user.clear(cell);
      await user.click(screen.getByRole('button', { name: 'save' }));

      await waitFor(() => expect(cell).toHaveAttribute('aria-invalid', 'true'));
      expect(cell).toHaveAccessibleDescription('form.errors.required');
    });

    it('explains that a table needs object or discriminated-union items', () => {
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      function PagesTable() {
        const handle = editorForm.useSchemaForm(schema, {
          defaultValues: { ...loaded, pages: ['home'] },
        });

        return (
          <editorForm.Form
            form={handle}
            onSubmit={vi.fn()}
            fields={{ 'pages.*': { component: bindComponent(PagePicker) } }}
          >
            <Field
              name="pages"
              props={{ variant: 'table' }}
            />
          </editorForm.Form>
        );
      }

      expect(() => renderEditorForm(<PagesTable />)).toThrow(
        'ArrayField variant="table" needs object or discriminated-union items, but "pages.0" is of kind "page".'
      );

      error.mockRestore();
    });

    it('renders discriminated-union items with a type column and the active branch cells', async () => {
      const onSubmit = vi.fn();
      const { user } = renderEditorForm(
        <View
          onSubmit={onSubmit}
          variant="table"
          defaultValues={{
            ...loaded,
            links: [
              { type: 'external', label: 'Blog', url: 'https://blog.ch' },
            ],
          }}
        />
      );
      const links = screen.getByRole('table', { name: 'navigation.links' });

      expect(
        within(links)
          .getAllByRole('columnheader')
          .map(header => header.textContent)
      ).toEqual([
        'form.array.reorder',
        'navigation.linkType',
        'navigation.linkLabel',
        'navigation.page',
        'navigation.url',
        'form.array.actions',
      ]);

      const row = within(links).getAllByRole('row')[1];

      expect(within(row).getAllByRole('cell')[3]).toBeEmptyDOMElement();
      expect(
        within(row).getByRole('textbox', { name: 'navigation.url' })
      ).toHaveValue('https://blog.ch');

      await user.click(
        within(row).getByRole('combobox', { name: 'navigation.linkType' })
      );
      await user.click(
        screen.getByRole('option', { name: 'navigation.linkType.page' })
      );

      expect(
        within(row).getByRole('textbox', { name: 'navigation.linkLabel' })
      ).toHaveValue('Blog');
      expect(
        within(row).queryByRole('textbox', { name: 'navigation.url' })
      ).not.toBeInTheDocument();

      await user.type(
        within(row).getByRole('textbox', { name: 'navigation.page' }),
        'p1'
      );
      await user.click(screen.getByRole('button', { name: 'save' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(submitted(onSubmit).links).toEqual([
        { type: 'page', label: 'Blog', pageId: 'p1' },
      ]);
    });
  });

  it('appends discriminated-union items as their first branch and switches a row', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);
    const links = () => screen.getByRole('group', { name: 'navigation.links' });

    await user.click(
      within(links()).getByRole('button', { name: 'form.array.add' })
    );

    const row = rowsOf(links())[0];

    expect(
      within(row).getByRole('radio', { name: 'navigation.linkType.page' })
    ).toBeChecked();

    await user.type(
      within(row).getByRole('textbox', { name: 'navigation.linkLabel' }),
      'Blog'
    );
    await user.click(
      within(row).getByRole('radio', { name: 'navigation.linkType.external' })
    );
    await user.type(
      within(row).getByRole('textbox', { name: /^navigation\.url/ }),
      'https://blog.ch'
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).links).toEqual([
      { type: 'external', label: 'Blog', url: 'https://blog.ch' },
    ]);
  });

  it('renders one picker per row for items of a custom kind', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ ...loaded, pages: ['home'] }}
      />
    );
    const pages = () => screen.getByRole('group', { name: 'navigation.pages' });

    expect(
      within(pages()).getByRole('combobox', { name: 'picker pages.0' })
    ).toHaveValue('home');

    await user.click(
      within(pages()).getByRole('button', { name: 'form.array.add' })
    );
    await user.selectOptions(
      within(pages()).getByRole('combobox', { name: 'picker pages.1' }),
      'about'
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).pages).toEqual(['home', 'about']);
  });
});
