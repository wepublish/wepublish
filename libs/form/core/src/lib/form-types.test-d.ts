import { lazy, memo, type ElementType, type ReactNode } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod/v4';
import { bindComponent, fieldComponent } from './bind-component';
import type { ComponentMap } from './component-types';
import { createForm } from './create-form';
import type {
  CreatedForm,
  CreateForm,
  FieldComponent,
  FieldsFor,
  FormConfig,
  FormProps,
  SchemaForm,
  SchemaFormOptions,
  SubmitContext,
} from './form-types';
import { withKind } from './kind';
import type {
  FieldActions,
  FieldOverrides,
  RequiredPaths,
} from './override-types';
import type { SchemaPath } from './path-types';
import { schemaResolver } from './schema-resolver';
import { setFieldError } from './set-field-error';
import type { AnyFormSchema, FormOutput, FormValues } from './value-types';

const TextField = (_: { type?: 'text' | 'password' }) => null;
const TextareaField = (_: { rows?: number }) => null;
const NumberField = (_: { unit?: string }) => null;
const SwitchField = () => null;
const SelectField = (_: { searchable?: boolean }) => null;
const DateField = () => null;
const ArrayField = (_: {
  variant?: 'list' | 'table';
  addLabel?: string;
  sortable?: boolean;
}) => null;
const ObjectField = () => null;
const UnionField = () => null;
const MultiSelectField = () => null;
const ChipsField = () => null;
const ImageField = () => null;
const CurrencyField = (_: { currency: string }) => null;
const TagsField = (_: { tagType: string }) => null;
const RichTextField = (_: { toolbar?: 'mini' | 'full' }) => null;
type QueryOptionsSource = { query: string };
const QuerySelectField = (_: {
  source: QueryOptionsSource;
  multiple?: boolean;
}) => null;

const editorForm = createForm({
  components: {
    string: TextField,
    textarea: TextareaField,
    number: NumberField,
    boolean: SwitchField,
    enum: SelectField,
    date: DateField,
    array: ArrayField,
    object: ObjectField,
    discriminatedUnion: UnionField,
    enumArray: MultiSelectField,
    primitiveArray: ChipsField,
    image: ImageField,
    tags: TagsField,
    richText: RichTextField,
  },
  useTranslate: () => key => key,
  useUnsavedChanges: dirty => {
    expectTypeOf(dirty).toEqualTypeOf<boolean>();
  },
});

const image = () => withKind(z.custom<{ id: string; url: string }>(), 'image');

const bannerSchema = z.object({
  title: z.string().min(1).meta({ label: 'banner.form.title' }),
  delay: z.number().int().min(0).default(0),
  active: z.boolean(),
  showForLoginStatus: z.enum(['ALL', 'LOGGED_IN']),
  starts: z.date(),
  image: image().nullable(),
  tagIds: withKind(z.array(z.string()), 'tags'),
  actions: z.array(
    z.object({
      label: z.string().min(1),
      url: z.url(),
      role: z.enum(['PRIMARY', 'OTHER']),
    })
  ),
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
        url: z.url(),
      }),
    ])
  ),
  goalType: z.enum(['Revenue', 'Subscriptions']),
  goal: z.number().nullable(),
  roles: z.array(z.enum(['admin', 'editor'])),
});

type BannerValues = FormValues<typeof bannerSchema>;

type EditorComponents =
  typeof editorForm extends CreatedForm<infer C> ? C : never;

const Banner = editorForm.fieldsFor(bannerSchema);
const Action = editorForm.fieldsFor(bannerSchema, 'actions.*');
const Link = editorForm.fieldsFor(bannerSchema, 'links.*');

const tagIds = { props: { tagType: 'Event' } };

describe('createForm', () => {
  it('implements CreateForm', () => {
    expectTypeOf(createForm).toEqualTypeOf<CreateForm>();
  });

  it('infers the component map', () => {
    expectTypeOf<EditorComponents['string']>().toEqualTypeOf<
      typeof TextField
    >();
    expectTypeOf<EditorComponents['tags']>().toEqualTypeOf<typeof TagsField>();
    expectTypeOf(editorForm.fieldsFor(bannerSchema)).toEqualTypeOf<
      FieldsFor<typeof bannerSchema, EditorComponents, ''>
    >();
  });

  it('types the config', () => {
    createForm({
      components: { string: TextField },
      useTranslate: () => (key, params) => `${key}${JSON.stringify(params)}`,
      as: 'div',
      Loading: () => null,
      LoadError: ({ error }) => (error instanceof Error ? error.message : null),
      onLoadError: error => expectTypeOf(error).toBeUnknown(),
      onSubmitError: error => expectTypeOf(error).toBeUnknown(),
      submitErrorKey: () => 'form.errors.server',
      mode: 'onSubmit',
      reValidateMode: 'onBlur',
    });
    createForm({
      components: { string: TextField },
      // @ts-expect-error useTranslate must return a translate function
      useTranslate: () => 'key',
    });
  });
});

describe('fieldsFor', () => {
  it('accepts item paths as scopes', () => {
    expectTypeOf(Action.Field).toEqualTypeOf<
      FieldComponent<typeof bannerSchema, EditorComponents, 'actions.*'>
    >();
    // @ts-expect-error a scope must be an item path of the schema
    editorForm.fieldsFor(bannerSchema, 'title.*');
    // @ts-expect-error a scope must be an item path of the schema
    editorForm.fieldsFor(bannerSchema, 'actions');
  });

  it('rejects scopes on custom-kind items, which have no fields', () => {
    const schema = z.object({
      pages: z.array(
        withKind(z.object({ id: z.string(), title: z.string() }), 'image')
      ),
    });

    // @ts-expect-error a custom-kind item is a leaf
    editorForm.fieldsFor(schema, 'pages.*');
  });
});

describe('useSchemaForm', () => {
  it('returns a null-honest handle', () => {
    const handle = editorForm.useSchemaForm(bannerSchema, {
      defaultValues: async () => ({ title: 'x' }),
    });

    expectTypeOf(handle).toEqualTypeOf<SchemaForm<typeof bannerSchema>>();
    expectTypeOf(handle.form.getValues('starts')).toEqualTypeOf<Date | null>();
    // @ts-expect-error form values are null-honest: starts is null until picked
    handle.form.getValues('starts').getTime();
  });

  it('accepts sync and async partial defaults, with nulls for empty fields', () => {
    editorForm.useSchemaForm(bannerSchema, {
      defaultValues: { title: 'x', starts: null, goal: null },
    });
    editorForm.useSchemaForm(bannerSchema, {
      defaultValues: async () => ({ actions: [{ label: 'a' }] }),
    });
    editorForm.useSchemaForm(bannerSchema, {
      mode: 'onSubmit',
      reValidateMode: 'onBlur',
    });
    // @ts-expect-error title is a string
    editorForm.useSchemaForm(bannerSchema, { defaultValues: { title: 1 } });
    // @ts-expect-error values would replace the loader
    editorForm.useSchemaForm(bannerSchema, { values: {} });
    // @ts-expect-error disabled drops every value from submit
    editorForm.useSchemaForm(bannerSchema, { disabled: true });
    // @ts-expect-error the resolver is the schema
    editorForm.useSchemaForm(bannerSchema, { resolver: undefined });
    // @ts-expect-error unregistering would drop the values of hidden fields and inactive branches
    editorForm.useSchemaForm(bannerSchema, { shouldUnregister: true });
  });

  it('keeps custom-kind values whole in defaults', () => {
    const user = () =>
      withKind(
        z.custom<{ id: string; name: string }>(value => value != null),
        'user'
      );
    const page = () =>
      withKind(z.object({ id: z.string(), title: z.string() }), 'page');
    const schema = z.object({
      owner: user(),
      image: image().nullish(),
      landing: page().optional(),
      items: z.array(z.object({ plan: user(), note: z.string() })),
      seo: z.object({ title: z.string(), slug: z.string() }).optional(),
    });

    editorForm.useSchemaForm(schema, {
      defaultValues: {
        owner: { id: 'u', name: 'n' },
        image: null,
        landing: { id: 'p', title: 't' },
      },
    });
    editorForm.useSchemaForm(schema, {
      defaultValues: { items: [{ note: 'x' }], seo: { title: 't' } },
    });
    editorForm.useSchemaForm(schema, {
      defaultValues: async () => ({ items: [], seo: undefined }),
    });
    // @ts-expect-error a user value is a whole user
    editorForm.useSchemaForm(schema, { defaultValues: { owner: { id: 'u' } } });
    editorForm.useSchemaForm(schema, {
      // @ts-expect-error a loaded image is a whole image
      defaultValues: async () => ({ image: { id: 'i' } }),
    });
    editorForm.useSchemaForm(schema, {
      // @ts-expect-error an object-based custom kind is a whole value too
      defaultValues: { landing: { id: 'p' } },
    });
    editorForm.useSchemaForm(schema, {
      // @ts-expect-error a custom-kind value inside an array item is a whole value
      defaultValues: { items: [{ plan: { id: 'u' } }] },
    });
  });

  it('keeps literal types in async defaults', () => {
    editorForm.useSchemaForm(bannerSchema, {
      defaultValues: async () => ({
        showForLoginStatus: 'ALL',
        goalType: 'Revenue',
        starts: new Date(),
      }),
    });
    const load = (
      status: string | null,
      loginStatus: 'ALL' | 'LOGGED_IN' | null
    ) => {
      editorForm.useSchemaForm(bannerSchema, {
        defaultValues: async () => ({
          showForLoginStatus: loginStatus ?? 'ALL',
        }),
      });
      editorForm.useSchemaForm(bannerSchema, {
        // @ts-expect-error a loaded string is not an enum value
        defaultValues: async () => ({ showForLoginStatus: status ?? 'ALL' }),
      });
    };

    editorForm.useSchemaForm(bannerSchema, {
      // @ts-expect-error NOBODY is not a login status
      defaultValues: async () => ({ showForLoginStatus: 'NOBODY' }),
    });
    expectTypeOf(load).returns.toBeVoid();
  });

  it('rejects schemas that are not objects', () => {
    // @ts-expect-error a non-object root schema is not a form
    editorForm.useSchemaForm(z.string());
  });

  it('rejects object-valued roots without fields', () => {
    // @ts-expect-error a record has no paths to render
    editorForm.useSchemaForm(z.record(z.string(), z.string()));
    editorForm.useSchemaForm(
      // @ts-expect-error a union without a discriminator has no paths to render
      z.union([z.object({ a: z.string() }), z.object({ b: z.string() })])
    );
    // @ts-expect-error a record has no paths to render
    editorForm.fieldsFor(z.record(z.string(), z.string()));
    editorForm.useSchemaForm(z.object({ a: z.string() }).readonly());
    editorForm.useSchemaForm(z.lazy(() => z.object({ a: z.string() })));
  });
});

describe('Form', () => {
  const handle = editorForm.useSchemaForm(bannerSchema);

  it('passes output values and the intent to onSubmit', () => {
    editorForm.Form({
      form: handle,
      fields: { tagIds },
      onSubmit: (values, context) => {
        expectTypeOf(values).toEqualTypeOf<z.output<typeof bannerSchema>>();
        expectTypeOf(values.delay).toEqualTypeOf<number>();
        expectTypeOf(values.actions[0].role).toEqualTypeOf<
          'PRIMARY' | 'OTHER'
        >();
        expectTypeOf(context).toEqualTypeOf<SubmitContext>();
        expectTypeOf(context.intent).toEqualTypeOf<string | undefined>();
        // @ts-expect-error the submit context only carries the intent
        context.keepDirty();
      },
      onInvalid: errors => {
        expectTypeOf(errors).toEqualTypeOf<FieldErrors<BannerValues>>();
      },
      warnOnUnsavedChanges: false,
      disabled: true,
      as: 'div',
      id: 'banner',
    });
  });

  it('types every override against its path', () => {
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds: { props: { tagType: 'Event' } },
        actions: {
          props: { variant: 'table', addLabel: 'banner.actions.add' },
        },
        'actions.*.role': {
          optionLabel: role => {
            expectTypeOf(role).toEqualTypeOf<'PRIMARY' | 'OTHER'>();

            return `banner.actionRole.${role}`;
          },
        },
        roles: {
          optionLabel: role => {
            expectTypeOf(role).toEqualTypeOf<'admin' | 'editor'>();

            return role;
          },
        },
        'links.*': {
          layout: ({ index, count, remove, move }) => {
            expectTypeOf(index).toEqualTypeOf<number>();
            expectTypeOf(count).toEqualTypeOf<number>();
            expectTypeOf(remove).toEqualTypeOf<() => void>();
            expectTypeOf(move).toEqualTypeOf<(to: number) => void>();

            return [
              Link.Field({ name: 'label' }),
              Link.Field({
                name: 'url',
                hidden: values => values.links[index]?.type !== 'external',
              }),
              Link.Field({ name: 'pageId' }),
            ];
          },
        },
        showForLoginStatus: {
          options: values => (values.active ? ['ALL', 'LOGGED_IN'] : ['ALL']),
        },
        goalType: {
          options: [{ value: 'Revenue', label: 'revenue' }, 'Subscriptions'],
        },
        title: {
          label: values =>
            values.active ? 'banner.titleActive' : 'banner.title',
          placeholder: 'banner.placeholder',
          hidden: false,
          disabled: values => !values.active,
          readOnly: true,
          required: values => values.goal === null,
          hideLabel: true,
          normalize: next => next.trim(),
          guard: (next, actions) => {
            expectTypeOf(actions).toEqualTypeOf<FieldActions<BannerValues>>();

            return next !== 'forbidden';
          },
          onValueChange: (value, actions) =>
            actions.setValue('delay', value ? 1 : 0),
        },
        delay: { props: values => ({ unit: values.active ? 's' : 'ms' }) },
        goal: { component: bindComponent(CurrencyField, { currency: 'CHF' }) },
      },
    });
  });

  it('gives Dynamic functions the null-honest form values', () => {
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        title: {
          hidden: values => {
            expectTypeOf(values).toEqualTypeOf<BannerValues>();

            return (values.starts?.getTime() ?? 0) > 0;
          },
        },
        // @ts-expect-error starts is null until picked
        delay: { hidden: values => values.starts.getTime() > 0 },
      },
    });
  });

  it('rejects unknown paths and wrong values', () => {
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error unknown path
        titel: { label: 'x' },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error optionLabel receives the enum value
        showForLoginStatus: { optionLabel: (value: number) => value },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error placeholder must be a string
        title: { placeholder: 1 },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error options are values of the field
        showForLoginStatus: { options: ['NOBODY'] },
      },
    });
  });

  it('types props against the component of the kind', () => {
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error unit must be a string
        delay: { props: { unit: 1 } },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error TextField has no rows prop
        title: { props: { rows: 1 } },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error SwitchField takes no props
        active: { props: {} },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        goal: {
          component: bindComponent(CurrencyField, { currency: 'CHF' }),
          // @ts-expect-error props belong to the bound component
          props: { unit: 's' },
        },
      },
    });
  });

  it('requires fields while a path needs props', () => {
    // @ts-expect-error tags needs tagType, so fields is required
    editorForm.Form({ form: handle, onSubmit: () => undefined });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      // @ts-expect-error tagIds is required
      fields: { title: { label: 'x' } },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        // @ts-expect-error tagType is required
        tagIds: { props: {} },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: { tagIds: { component: bindComponent(ChipsField) } },
    });
  });

  it('allows layout only on item paths', () => {
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error layout only on item paths
        title: { layout: () => null },
      },
    });
  });
});

describe('Field', () => {
  it('renders paths with per-call overrides', () => {
    expectTypeOf(Banner.Field({ name: 'title' })).toEqualTypeOf<ReactNode>();
    Banner.Field({
      name: 'title',
      label: values => (values.active ? 'banner.titleActive' : 'banner.title'),
    });
    Banner.Field({
      name: 'goal',
      component: bindComponent(CurrencyField, { currency: 'CHF' }),
    });
    Banner.Field({ name: 'delay', props: { unit: 's' }, required: true });
    Banner.Field({
      name: 'delay',
      props: values => ({ unit: values.active ? 's' : 'ms' }),
    });
    Banner.Field({ name: 'tagIds', props: { tagType: 'Event' } });
    Banner.Field({
      name: 'showForLoginStatus',
      optionLabel: value => `x.${value}`,
    });
    Action.Field({ name: 'label' });
    Action.Field({ name: 'role', optionLabel: role => role.toLowerCase() });
  });

  it('rejects unknown, star and out-of-scope names', () => {
    // @ts-expect-error unknown path
    Banner.Field({ name: 'titel' });
    // @ts-expect-error star paths are rendered by their array
    Banner.Field({ name: 'actions.*.label' });
    // @ts-expect-error relative names only inside a scope
    Action.Field({ name: 'title' });
    // @ts-expect-error the scope is relative already
    Action.Field({ name: 'actions.*.label' });
  });

  it('types the intent from the intents the form declares', () => {
    const intentForm = createForm({
      components: { string: TextField },
      useTranslate: () => key => key,
      intents: ['save', 'close'],
    });
    const schema = z.object({ title: z.string() });
    const handle = intentForm.useSchemaForm(schema);

    expectTypeOf(intentForm).toEqualTypeOf<
      CreatedForm<{ string: typeof TextField }, 'save' | 'close'>
    >();
    intentForm.Form({
      form: handle,
      onSubmit: (_values, { intent }) => {
        expectTypeOf(intent).toEqualTypeOf<'save' | 'close' | undefined>();
        // @ts-expect-error a mistyped intent has no overlap with the declared ones
        return intent === 'clsoe';
      },
    });
    intentForm.Form({
      form: handle,
      onSubmit: (_values: unknown, context: SubmitContext) => context.intent,
    });
  });

  it('checks a bound component against the value of its field', () => {
    const CentsField = fieldComponent<number | null>()(CurrencyField);
    const handle = editorForm.useSchemaForm(bannerSchema);

    Banner.Field({
      name: 'goal',
      component: bindComponent(CentsField, { currency: 'CHF' }),
    });
    Banner.Field({
      name: 'delay',
      component: bindComponent(CentsField, { currency: 'CHF' }),
    });
    Banner.Field({ name: 'title', component: bindComponent(TextField) });
    Banner.Field({
      name: 'title',
      // @ts-expect-error a cents field cannot edit a string
      component: bindComponent(CentsField, { currency: 'CHF' }),
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        goal: { component: bindComponent(CentsField, { currency: 'CHF' }) },
      },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds,
        // @ts-expect-error a cents field cannot edit a string
        title: { component: bindComponent(CentsField, { currency: 'CHF' }) },
      },
    });
  });

  it('types per-call values against the field', () => {
    Banner.Field({
      name: 'showForLoginStatus',
      // @ts-expect-error optionLabel value is typed
      optionLabel: (value: number) => value,
    });
    // @ts-expect-error per-call props are typed against the kind's component
    Banner.Field({ name: 'delay', props: { unit: 1 } });
    // @ts-expect-error bindComponent requires the component's required props
    Banner.Field({ name: 'goal', component: bindComponent(CurrencyField) });
    // @ts-expect-error SwitchField takes no props
    Banner.Field({ name: 'active', props: { unit: 's' } });
    // @ts-expect-error props belong to the bound component
    Banner.Field({
      name: 'goal',
      component: bindComponent(TextField),
      props: { unit: 's' },
    });
    // @ts-expect-error layout is set in fields
    Link.Field({ name: 'label', layout: () => null });
  });
});

describe('AutoFields', () => {
  it('omits top-level keys', () => {
    expectTypeOf(
      Banner.AutoFields({ omit: ['title', 'goal'] })
    ).toEqualTypeOf<ReactNode>();
    Action.AutoFields({ omit: ['label'] });
    // @ts-expect-error AutoFields omit takes top-level keys
    Banner.AutoFields({ omit: ['actions.*.label'] });
    // @ts-expect-error omit is relative to the scope
    Action.AutoFields({ omit: ['title'] });
  });
});

describe('unmapped kinds', () => {
  const unmappedSchema = z.object({
    name: z.string(),
    meta: z.record(z.string(), z.string()),
    color: withKind(z.string(), 'color'),
  });
  const handle = editorForm.useSchemaForm(unmappedSchema);

  it('require a component override', () => {
    expectTypeOf<
      RequiredPaths<typeof unmappedSchema, EditorComponents>
    >().toEqualTypeOf<'meta' | 'color'>();
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        meta: { component: bindComponent(TextareaField) },
        color: { component: bindComponent(CurrencyField, { currency: 'x' }) },
      },
    });
    // @ts-expect-error kinds "color" and record have no component
    editorForm.Form({ form: handle, onSubmit: () => undefined });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      // @ts-expect-error color has no component
      fields: { meta: { component: bindComponent(TextareaField) } },
    });
    editorForm.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        meta: { component: bindComponent(TextareaField) },
        // @ts-expect-error props need a component
        color: { props: { type: 'text' } },
      },
    });
  });

  it('require a component when one branch of a shared key has no kind', () => {
    const ruleSchema = z.object({
      rule: z.discriminatedUnion('type', [
        z.object({ type: z.literal('text'), value: z.string() }),
        z.object({
          type: z.literal('map'),
          value: z.record(z.string(), z.string()),
        }),
      ]),
    });
    const ruleHandle = editorForm.useSchemaForm(ruleSchema);

    expectTypeOf<
      RequiredPaths<typeof ruleSchema, EditorComponents>
    >().toEqualTypeOf<'rule.value'>();
    // @ts-expect-error the map branch of rule.value has no component
    editorForm.Form({ form: ruleHandle, onSubmit: () => undefined });
    editorForm.Form({
      form: ruleHandle,
      onSubmit: () => undefined,
      fields: { 'rule.value': { component: bindComponent(TextareaField) } },
    });
    editorForm.Form({
      form: ruleHandle,
      onSubmit: () => undefined,
      fields: {
        // @ts-expect-error a label alone renders nothing for the map branch
        'rule.value': { label: 'rule.value' },
      },
    });
  });

  it('accept a layout instead of a component on item paths', () => {
    const plainForm = createForm({
      components: { string: TextField, array: ArrayField },
      useTranslate: () => key => key,
    });
    const schema = z.object({
      items: z.array(z.object({ label: z.string() })),
    });
    const plainHandle = plainForm.useSchemaForm(schema);
    const Item = plainForm.fieldsFor(schema, 'items.*');

    plainForm.Form({
      form: plainHandle,
      onSubmit: () => undefined,
      fields: { 'items.*': { layout: () => Item.Field({ name: 'label' }) } },
    });
    // @ts-expect-error the object item has no component
    plainForm.Form({ form: plainHandle, onSubmit: () => undefined });
  });
});

describe('components with required props', () => {
  const withQuery = createForm({
    components: {
      string: TextField,
      textarea: TextareaField,
      number: NumberField,
      array: ArrayField,
      object: ObjectField,
      querySelect: QuerySelectField,
    },
    useTranslate: () => key => key,
  });
  const eventSchema = z.object({
    name: z.string().min(1),
    tagIds: withKind(z.array(z.string()), 'querySelect', {
      tagType: 'Event' as const,
    }),
    lead: withKind(z.string(), 'textarea').nullish(),
    pages: z.array(z.object({ pageId: withKind(z.string(), 'querySelect') })),
  });
  type QueryComponents =
    typeof withQuery extends CreatedForm<infer C> ? C : never;
  const handle = withQuery.useSchemaForm(eventSchema);
  const source: QueryOptionsSource = { query: 'tags' };

  it('become required paths', () => {
    expectTypeOf<
      RequiredPaths<typeof eventSchema, QueryComponents>
    >().toEqualTypeOf<'tagIds' | 'pages.*.pageId'>();
    expectTypeOf<
      keyof FieldOverrides<typeof eventSchema, QueryComponents>
    >().toEqualTypeOf<SchemaPath<typeof eventSchema>>();
  });

  it('accept props, Dynamic props or a component', () => {
    withQuery.Form({
      form: handle,
      onSubmit: values => values.tagIds.join(),
      fields: {
        tagIds: { props: { source, multiple: true } },
        'pages.*.pageId': {
          props: values => ({ source: { query: values.name } }),
        },
      },
    });
    withQuery.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds: { component: bindComponent(TextField) },
        'pages.*.pageId': { props: { source } },
      },
    });
  });

  it('report the missing ones', () => {
    // @ts-expect-error fields is required because querySelect needs source
    withQuery.Form({ form: handle, onSubmit: () => undefined });
    withQuery.Form({
      form: handle,
      onSubmit: () => undefined,
      // @ts-expect-error pages.*.pageId override missing
      fields: { tagIds: { props: { source } } },
    });
    withQuery.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        // @ts-expect-error props.source missing
        tagIds: { props: { multiple: true } },
        'pages.*.pageId': { props: { source } },
      },
    });
    withQuery.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: {
        tagIds: {
          // @ts-expect-error bindComponent props are checked
          component: bindComponent(RichTextField, { toolbar: 'huge' }),
        },
        'pages.*.pageId': { props: { source } },
      },
    });
  });
});

describe('special roots and components', () => {
  it('handles a discriminated union root', () => {
    const integrationSchema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('stripe'),
        secretKey: z.string(),
        webhookSecret: z.string(),
      }),
      z.object({
        type: z.literal('payrexx'),
        instance: z.string(),
        apiSecret: z.string(),
      }),
    ]);
    const Integration = editorForm.fieldsFor(integrationSchema);
    const handle = editorForm.useSchemaForm(integrationSchema, {
      defaultValues: async () => ({ type: 'stripe', secretKey: '' }),
    });

    editorForm.Form({
      form: handle,
      onSubmit: values =>
        values.type === 'stripe' ? values.secretKey : values.instance,
      fields: { type: { optionLabel: type => `integration.${type}` } },
    });
    Integration.Field({ name: 'type', readOnly: true });
    Integration.Field({ name: 'secretKey' });
    Integration.Field({ name: 'instance' });
  });

  it('passes transformed output to onSubmit', () => {
    const top = z
      .object({ a: z.string(), n: z.number(), b: z.boolean() })
      .transform(value => ({ ...value, sum: value.n + 1 }));
    const handle = editorForm.useSchemaForm(top);

    editorForm.Form({ form: handle, onSubmit: values => values.sum.toFixed() });
  });

  it('reads the props of memo and lazy components', () => {
    const Memoed = memo((_: { b: string }) => null);
    const Lazy = lazy(async () => ({ default: (_: { c?: boolean }) => null }));
    const form = createForm({
      components: {
        string: TextField,
        number: Memoed,
        boolean: Lazy,
        object: ObjectField,
      },
      useTranslate: () => key => key,
    });
    const schema = z.object({ a: z.string(), n: z.number(), b: z.boolean() });
    const handle = form.useSchemaForm(schema);

    form.Form({
      form: handle,
      onSubmit: () => undefined,
      fields: { n: { props: { b: 'x' } }, b: { props: { c: true } } },
    });
    // @ts-expect-error Memoed needs b
    form.Form({ form: handle, onSubmit: () => undefined });
  });
});

describe('setFieldError', () => {
  it('types the path and params', () => {
    const refined = z
      .object({
        starts: z.date(),
        ends: z.date().nullable(),
        actions: z.array(z.object({ label: z.string() })),
      })
      .refine(
        value => !value.ends || !value.starts || value.ends > value.starts,
        {
          path: ['ends'],
          error: 'event.endsBeforeStarts',
        }
      );
    const handle = editorForm.useSchemaForm(refined);

    setFieldError(handle.form, 'ends', 'event.overlap', { other: 'x' });
    setFieldError(handle.form, 'actions.0.label', 'event.label');
    setFieldError(handle.form, 'root.server', 'form.errors.server');
    // @ts-expect-error unknown path
    setFieldError(handle.form, 'end', 'x');
    // @ts-expect-error params are a record
    setFieldError(handle.form, 'ends', 'x', 'y');
  });
});

describe('CreatedForm can be implemented without casts', () => {
  it('accepts generic implementations', () => {
    const implement = <C extends ComponentMap>(
      config: FormConfig<C>
    ): CreatedForm<C> => {
      const useSchemaForm = <S extends AnyFormSchema>(
        schema: S,
        options?: SchemaFormOptions<S>
      ): SchemaForm<S> => {
        const form = useForm<FormValues<S>, unknown, FormOutput<S>>({
          mode: options?.mode ?? 'onTouched',
          resolver: schemaResolver(schema),
        });

        return {
          form,
          schema,
          loadError: undefined,
          reloading: false,
          retry: () => undefined,
        };
      };
      const Form = <S extends AnyFormSchema>(
        props: FormProps<S, C>
      ): ReactNode => {
        const fields: Partial<Record<string, unknown>> | undefined =
          props.fields;
        const element: ElementType = props.as ?? config.as ?? 'form';
        const onValid = (values: FormOutput<S>) =>
          props.onSubmit(values, { intent: undefined });

        props.form.form.handleSubmit(onValid);

        return fields && element ? props.children : null;
      };
      const fieldsFor = <
        S extends AnyFormSchema,
        const Scope extends string = '',
      >(
        _schema: S,
        scope?: Scope
      ) => ({
        Field: ({ name }: { name: string }): ReactNode =>
          scope ? `${scope}.${name}` : name,
        AutoFields: ({ omit }: { omit?: readonly string[] }): ReactNode =>
          omit?.join(),
      });

      return { useSchemaForm, Form, fieldsFor };
    };

    expectTypeOf(implement).returns.toEqualTypeOf<CreatedForm<ComponentMap>>();
  });
});
