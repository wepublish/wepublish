import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod/v4';
import {
  createTestForm,
  ErrorSummary,
  fieldText,
  input,
  settle,
} from '../testing/form-test-kit';
import { useUnionField } from './use-union-field';

const form = createTestForm();

const linkSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('page'),
    label: z.string(),
    pageId: z.string().min(1),
  }),
  z.object({
    type: z.literal('external'),
    label: z.string(),
    url: z.string().min(1),
  }),
]);

const schema = z.object({ title: z.string(), link: linkSchema });

type Values = z.output<typeof schema>;

const { Field } = form.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  link = { type: 'page', label: 'Home', pageId: 'p1' },
}: {
  onSubmit?: (values: Values) => void;
  link?: Values['link'];
}) {
  const handle = form.useSchemaForm(schema, {
    defaultValues: async () => ({ title: 't', link }),
  });

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
      fields={{ 'link.type': { optionLabel: type => `link.type.${type}` } }}
    >
      <Field name="link" />
      <button type="submit">save</button>
    </form.Form>
  );
}

describe('useUnionField', () => {
  it('renders the discriminator options and the active branch', async () => {
    render(<View />);
    await settle();

    expect(screen.getByLabelText('link:type')).toHaveValue('page');
    expect(
      [...screen.getByLabelText('link:type').querySelectorAll('option')].map(
        option => option.textContent
      )
    ).toEqual(['link.type.page', 'link.type.external']);
    expect(screen.getByLabelText('link.label')).toHaveValue('Home');
    expect(screen.getByLabelText('link.pageId')).toHaveValue('p1');
    expect(screen.queryByLabelText('link.url')).not.toBeInTheDocument();
  });

  it('keeps shared keys on a type switch and drops stale keys on submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.selectOptions(screen.getByLabelText('link:type'), 'external');

    expect(screen.getByLabelText('link.label')).toHaveValue('Home');
    expect(screen.getByLabelText('link.url')).toHaveValue('');
    expect(screen.queryByLabelText('link.pageId')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('link.url'), 'https://x.ch');
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      title: 't',
      link: { type: 'external', label: 'Home', url: 'https://x.ch' },
    });
  });

  it('starts the new branch from its empty values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.selectOptions(screen.getByLabelText('link:type'), 'external');
    await user.click(screen.getByText('save'));
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /^form\.errors\.required/
    );
  });

  it('throws outside a union component', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    function Broken() {
      useUnionField();

      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      'useUnionField must be called inside a form field component.'
    );

    error.mockRestore();
  });
});

describe('a Dynamic options override on the discriminator', () => {
  function OptionsView() {
    const handle = form.useSchemaForm(schema, {
      defaultValues: {
        title: '',
        link: { type: 'external', label: '', url: '' },
      },
    });

    return (
      <form.Form
        form={handle}
        onSubmit={vi.fn()}
        fields={{
          'link.type': {
            options: values =>
              values.title === 'external' ? ['external'] : ['page', 'external'],
          },
        }}
      >
        <Field name="title" />
        <Field name="link" />
      </form.Form>
    );
  }

  const optionValues = () =>
    [...screen.getByLabelText('link:type').querySelectorAll('option')].map(
      option => option.value
    );

  it('evaluates the options against the current values', async () => {
    const user = userEvent.setup();

    render(<OptionsView />);

    expect(optionValues()).toEqual(['page', 'external']);

    await user.type(input('title'), 'external');

    expect(optionValues()).toEqual(['external']);

    await user.type(input('title'), '!');

    expect(optionValues()).toEqual(['page', 'external']);
  });
});

describe('keys shared by union branches', () => {
  const ruleSchema = z.object({
    rule: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('text'),
        value: z.string().meta({ label: 'rule.text' }),
      }),
      z.object({
        type: z.literal('count'),
        value: z.number().min(1).meta({ label: 'rule.count' }),
      }),
    ]),
    block: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('text'),
        items: z.array(z.object({ text: z.string() })),
      }),
      z.object({
        type: z.literal('count'),
        items: z.array(z.object({ count: z.number() })),
      }),
    ]),
  });

  type RuleValues = z.output<typeof ruleSchema>;

  const Rule = form.fieldsFor(ruleSchema);

  function RuleView({
    onSubmit = vi.fn(),
    rule,
    block = { type: 'count', items: [] },
    summary = false,
  }: {
    onSubmit?: (values: RuleValues) => void;
    rule: RuleValues['rule'];
    block?: RuleValues['block'];
    summary?: boolean;
  }) {
    const handle = form.useSchemaForm(ruleSchema, {
      defaultValues: { rule, block },
    });

    return (
      <form.Form
        form={handle}
        onSubmit={onSubmit}
      >
        {summary ?
          <ErrorSummary />
        : null}
        <Rule.Field name="rule" />
        <Rule.Field name="block" />
        <button type="submit">save</button>
      </form.Form>
    );
  }

  it('renders a shared key with the schema of the active branch', () => {
    render(<RuleView rule={{ type: 'count', value: 3 }} />);

    expect(screen.getByLabelText('rule.value')).toHaveAttribute(
      'type',
      'number'
    );
    expect(screen.getByLabelText('rule.value')).toHaveValue(3);
    expect(fieldText('rule.value')).toContain('rule.count *');
  });

  it('follows the active branch after a type switch', async () => {
    const user = userEvent.setup();

    render(<RuleView rule={{ type: 'text', value: 'abc' }} />);

    expect(screen.getByLabelText('rule.value')).toHaveAttribute('type', 'text');

    await user.selectOptions(screen.getByLabelText('rule:type'), 'count');

    expect(screen.getByLabelText('rule.value')).toHaveAttribute(
      'type',
      'number'
    );
  });

  it('replaces a shared value that the new branch rejects with its empty value', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <RuleView
        rule={{ type: 'text', value: 'abc' }}
        onSubmit={onSubmit}
      />
    );
    await user.selectOptions(screen.getByLabelText('rule:type'), 'count');
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(fieldText('rule.value')).toContain('form.errors.required')
    );
    expect(screen.getByLabelText('rule.value')).toHaveValue(null);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('appends the element of the active branch to a shared array', async () => {
    const user = userEvent.setup();

    render(<RuleView rule={{ type: 'text', value: 'a' }} />);
    await user.click(screen.getByText('add block.items'));

    expect(screen.getByLabelText('block.items.0.count')).toHaveValue(null);
    expect(
      screen.queryByLabelText('block.items.0.text')
    ).not.toBeInTheDocument();
  });

  it('labels a summary entry with the schema of the active branch', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    function HiddenRuleView() {
      const handle = form.useSchemaForm(ruleSchema, {
        defaultValues: {
          rule: { type: 'count', value: 0 },
          block: { type: 'text', items: [] },
        },
      });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <ErrorSummary />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    render(<HiddenRuleView />);
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(screen.getByRole('listitem')).toHaveTextContent(
        /^rule\.value:rule\.count:/
      )
    );

    error.mockRestore();
  });
});
