import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { z } from 'zod/v4';
import { createTestForm, settle } from '../testing/form-test-kit';
import { bindComponent } from './bind-component';
import type { ItemLayoutProps } from './override-types';
import { useArrayField } from './use-array-field';
import { useObjectField } from './use-object-field';

const form = createTestForm();

const schema = z.object({
  actions: z
    .array(
      z.object({
        label: z.string().min(1).meta({ label: 'action.label' }),
        url: z.string(),
      })
    )
    .min(1),
  links: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('page'),
        label: z.string(),
        pageId: z.string(),
      }),
      z.object({
        type: z.literal('external'),
        label: z.string(),
        url: z.string(),
      }),
    ])
  ),
});

type Values = z.output<typeof schema>;

const { Field } = form.fieldsFor(schema);
const Action = form.fieldsFor(schema, 'actions.*');

const loaded: Values = {
  actions: [
    { label: 'A', url: '' },
    { label: 'B', url: '' },
  ],
  links: [],
};

function RowControls({
  index,
  count,
  remove,
  move,
}: {
  index: number;
  count: number;
  remove: () => void;
  move: (to: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={remove}
      >
        remove {index}
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => move(index + 1)}
      >
        down {index}
      </button>
    </>
  );
}

function View({
  onSubmit = vi.fn(),
  withLayout = true,
}: {
  onSubmit?: (values: Values) => void;
  withLayout?: boolean;
}) {
  const handle = form.useSchemaForm(schema, { defaultValues: loaded });

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
      fields={
        withLayout ?
          {
            'actions.*': {
              layout: item => (
                <span data-testid={`row-${item.index}`}>
                  <Action.Field
                    name="label"
                    hideLabel
                  />
                  <RowControls {...item} />
                </span>
              ),
            },
          }
        : {}
      }
    >
      <Field name="actions" />
      <Field name="links" />
      <button type="submit">save</button>
    </form.Form>
  );
}

const rows = () => screen.getAllByTestId('actions.row');

describe('useArrayField', () => {
  it('renders items through the item layout with scoped fields', () => {
    render(<View />);

    expect(rows()).toHaveLength(2);
    expect(screen.getByLabelText('actions.0.label')).toHaveValue('A');
    expect(screen.getByLabelText('actions.1.label')).toHaveValue('B');
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
  });

  it('keeps the DOM node of a row input across keystrokes', async () => {
    const user = userEvent.setup();

    render(<View />);

    const first = screen.getByLabelText('actions.0.label');

    await user.type(first, 'BC');

    expect(screen.getByLabelText('actions.0.label')).toBe(first);
    expect(first).toHaveValue('ABC');
  });

  it('appends, moves and removes items, keeping their DOM nodes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<View onSubmit={onSubmit} />);

    const first = screen.getByLabelText('actions.0.label');

    await user.click(screen.getByText('add actions'));
    await user.type(screen.getByLabelText('actions.2.label'), 'C');
    await user.click(screen.getByText('down 0'));

    expect(screen.getByLabelText('actions.1.label')).toBe(first);
    expect(screen.getByLabelText('actions.0.label')).toHaveValue('B');

    await user.click(screen.getByText('remove 0'));

    expect(screen.getByLabelText('actions.0.label')).toBe(first);

    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].actions).toEqual([
      { label: 'A', url: '' },
      { label: 'C', url: '' },
    ]);
  });

  it('renders the component of the element without a layout', () => {
    render(<View withLayout={false} />);

    const row = rows()[0];

    expect(
      within(row).getByRole('group', { name: 'actions.0' })
    ).toBeInTheDocument();
    expect(within(row).getByLabelText('actions.0.url')).toHaveValue('');
    expect(within(row).getByText('action.label *')).toBeInTheDocument();
  });

  it('appends the first branch of a discriminated-union element', async () => {
    const user = userEvent.setup();

    render(<View />);
    await user.click(screen.getByText('add links'));

    expect(screen.getByLabelText('links.0:type')).toHaveValue('page');
    expect(screen.getByLabelText('links.0.pageId')).toHaveValue('');
  });

  it('shows the array-level error at the array', async () => {
    const user = userEvent.setup();

    render(<View />);
    await user.click(screen.getByText('remove 1'));
    await user.click(screen.getByText('remove 0'));
    await user.click(screen.getByText('save'));
    await settle();

    expect(
      within(screen.getByRole('region', { name: 'actions' })).getByRole('alert')
        .textContent
    ).toMatch(/^form\.errors\.required\|/);
  });

  it('renders a layout component that uses hooks', async () => {
    const user = userEvent.setup();

    function ConfirmRow({ index, remove }: ItemLayoutProps) {
      const [confirming, setConfirming] = useState(false);

      return (
        <span>
          <Action.Field
            name="label"
            hideLabel
          />
          <button
            type="button"
            onClick={() => (confirming ? remove() : setConfirming(true))}
          >
            {confirming ? `confirm ${index}` : `remove ${index}`}
          </button>
        </span>
      );
    }

    function HookView() {
      const handle = form.useSchemaForm(schema, { defaultValues: loaded });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
          fields={{ 'actions.*': { layout: ConfirmRow } }}
        >
          <Field name="actions" />
        </form.Form>
      );
    }

    render(<HookView />);
    await user.click(screen.getByText('add actions'));
    await user.click(screen.getByText('add actions'));

    expect(rows()).toHaveLength(4);

    await user.click(screen.getByText('remove 3'));
    await user.click(screen.getByText('confirm 3'));

    expect(rows()).toHaveLength(3);
  });

  it('lets an array render its items as a table', () => {
    function TableRow() {
      const row = useObjectField();

      return row.keys.map(key => (
        <td key={key}>{row.renderField(key, { hideLabel: true })}</td>
      ));
    }

    function TableField() {
      const list = useArrayField();

      return (
        <table aria-label={list.name}>
          <thead>
            <tr>
              {list.itemKeys.map(item => (
                <th key={item.key}>{item.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.items.map(item => (
              <tr key={item.key}>
                {list.renderItem(item.index, {
                  component: bindComponent(TableRow),
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    function TableView() {
      const handle = form.useSchemaForm(schema, { defaultValues: loaded });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
          fields={{ 'actions.*.url': { label: 'action.url' } }}
        >
          <Field
            name="actions"
            component={bindComponent(TableField)}
          />
        </form.Form>
      );
    }

    render(<TableView />);

    const table = screen.getByRole('table', { name: 'actions' });

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(header => header.textContent)
    ).toEqual(['action.label', 'action.url']);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByLabelText('actions.1.label')).toHaveValue('B');
    expect(
      within(table).queryByText(/action\.label \*/)
    ).not.toBeInTheDocument();
  });

  it('describes the item keys with their translated descriptions', () => {
    const described = z.object({
      actions: z.array(
        z.object({
          label: z.string().meta({ label: 'action.label' }),
          style: z
            .string()
            .meta({ label: 'action.style', description: 'action.styleInfo' }),
          url: z.string().meta({ label: 'action.url' }),
        })
      ),
    });
    const Described = form.fieldsFor(described);

    function KeyList() {
      const list = useArrayField();

      return (
        <dl>
          {list.itemKeys.map(item => (
            <dd
              key={item.key}
              aria-label={`${item.key} description`}
            >
              {item.description}
            </dd>
          ))}
        </dl>
      );
    }

    function DescribedView() {
      const handle = form.useSchemaForm(described);

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
          fields={{ 'actions.*.label': { description: 'action.labelInfo' } }}
        >
          <Described.Field
            name="actions"
            component={bindComponent(KeyList)}
          />
        </form.Form>
      );
    }

    render(<DescribedView />);

    expect(screen.getByLabelText('label description')).toHaveTextContent(
      'action.labelInfo'
    );
    expect(screen.getByLabelText('style description')).toHaveTextContent(
      'action.styleInfo'
    );
    expect(screen.getByLabelText('url description')).toBeEmptyDOMElement();
  });

  it('throws outside an array component', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    function Broken() {
      useArrayField();

      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      'useArrayField must be called inside a form field component.'
    );

    error.mockRestore();
  });
});
