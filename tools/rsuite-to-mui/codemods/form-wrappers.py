"""Swap the rsuite `<Form model={Schema.Model(...)}>` wrapper for a plain
`<form>` driven by react-hook-form + zod.

The schemas are hand-translated per file (below) rather than derived: rsuite's
rules are terse but their edges differ from zod's — an absent key passes an
rsuite model unless `isRequired`, whereas zod requires every declared key — and
getting that wrong silently changes what can be submitted.
"""
import re
import sys

# path -> (zod schema source, the state variable the form validates,
#          and optionally the call the submit handler makes, when it is not
#          the `onSubmit()` these forms usually carry)
SCHEMAS = {
    'apps/editor/src/app/routes/events/eventCreateView.tsx': ("""z
    .object({
      name: z.string().min(1),
      // The record stores ISO strings, so validate strings and compare as
      // dates rather than coercing and fighting the declared type.
      startsAt: z.string().min(1),
      endsAt: z.string().nullish(),
    })
    .refine(
      value =>
        !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt),
      { path: ['endsAt'] }
    )""", 'event'),

    'apps/editor/src/app/routes/events/eventEditView.tsx': ("""z
    .object({
      name: z.string().min(1),
      status: z.string().min(1),
      startsAt: z.string().min(1),
      endsAt: z.string().nullish(),
    })
    .refine(
      value =>
        !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt),
      { path: ['endsAt'] }
    )""", 'event'),

    'apps/editor/src/app/routes/goodie/goodieCreateView.tsx': ("""z.object({
    name: z.string().min(1),
    stock: z.coerce.number().int().min(0).nullish(),
  })""", 'goodie'),

    'apps/editor/src/app/routes/goodie/goodieEditView.tsx': ("""z.object({
    name: z.string().min(1),
    stock: z.coerce.number().int().min(0).nullish(),
  })""", 'goodie'),

    'apps/editor/src/app/routes/discountCode/discountCodeCreateView.tsx': ("""z
    .object({
      code: z.string().min(3),
      discountPercent: z.coerce.number().int().min(0).max(100),
      validFrom: z.coerce.date(),
      validTo: z.coerce.date(),
      memberPlanId: z.string().min(1),
    })
    .refine(value => value.validTo >= value.validFrom, { path: ['validTo'] })""", 'discountCode'),

    'apps/editor/src/app/routes/discountCode/discountCodeEditView.tsx': ("""z
    .object({
      code: z.string().min(3),
      discountPercent: z.coerce.number().int().min(0).max(100),
      validFrom: z.coerce.date(),
      validTo: z.coerce.date(),
      memberPlanId: z.string().min(1),
    })
    .refine(value => value.validTo >= value.validFrom, { path: ['validTo'] })""", 'discountCode'),

    'libs/consent/editor/src/lib/consent-create-view.tsx': ("""z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    defaultValue: z.boolean(),
  })""", 'consent'),

    'libs/consent/editor/src/lib/consent-edit-view.tsx': ("""z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    defaultValue: z.boolean(),
  })""", 'consent'),

    'libs/consent/editor/src/lib/user-consent-create-view.tsx': ("""z.object({
    userId: z.string().min(1),
    consentId: z.string().min(1),
    value: z.boolean(),
  })""", 'userConsent'),

    'libs/consent/editor/src/lib/user-consent-edit-view.tsx': ("""z.object({
    value: z.boolean(),
  })""", 'userConsent'),

    'apps/editor/src/app/routes/paywall/paywallCreateView.tsx': ("""z.object({
    name: z.string().min(1),
    active: z.boolean(),
    anyMemberPlan: z.boolean(),
    memberPlanIds: z.array(z.string()).nullish(),
    // Optional, but a URL when given.
    alternativeSubscribeUrl: z
      .union([z.literal(''), z.string().url()])
      .nullish(),
  })""", 'paywall'),

    'apps/editor/src/app/routes/paywall/paywallEditView.tsx': ("""z.object({
    name: z.string().min(1),
    active: z.boolean(),
    anyMemberPlan: z.boolean(),
    memberPlanIds: z.array(z.string()).nullish(),
    alternativeSubscribeUrl: z
      .union([z.literal(''), z.string().url()])
      .nullish(),
  })""", 'paywall'),

    'libs/crowdfunding/editor/src/lib/create-crowdfunding-form.tsx': ("""z.object({
    name: z.string().min(1),
  })""", 'crowdfunding'),

    'libs/crowdfunding/editor/src/lib/edit-crowdfunding-form.tsx': ("""z.object({
    name: z.string().min(1),
  })""", 'crowdfunding'),

    'libs/banner/editor/src/lib/create-banner-form.tsx': ("""z.object({
    title: z.string().min(1),
    text: z.string().min(1),
    delay: z.coerce.number().min(0).nullish(),
    hideForMinutes: z.coerce.number().min(0),
  })""", 'banner'),

    'libs/banner/editor/src/lib/edit-banner-form.tsx': ("""z.object({
    title: z.string().min(1),
    text: z.string().min(1),
  })""", 'banner'),
}


SCHEMAS.update({
    # Nothing was ever declared here; the model was an empty object.
    'apps/editor/src/app/routes/comments/commentEditView.tsx':
        (None, None, 'handleSave()'),

    'apps/editor/src/app/routes/polls/pollEditView.tsx': ("""z.object({
    question: z.string().min(1),
  })""", 'poll', 'saveOrUpdate()'),

    'libs/membership/editor/src/lib/memberplan/memberplan-edit.tsx':
        ("""z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    currency: z.string().min(1),
  })""", 'memberPlan', 'saveMemberPlan()'),
})


def convert(path):
    schema_src, state, *rest = SCHEMAS[path]
    submit = rest[0] if rest else 'onSubmit()'
    s = open(path).read()
    original = s

    # --- the Schema.Model block -> a zod schema + the form hook ------------
    model = re.search(
        r'(?:[ \t]*const \{[^}]*\} = Schema\.Types;\n)?'
        r'[ \t]*const validationModel = Schema\.Model\(\{[\s\S]*?\n?[ \t]*\}\);\n',
        s)
    if not model:
        return f'{path}: no Schema.Model block'

    if schema_src is None:
        # Nothing was ever validated here; the wrapper was pure ceremony.
        s = s[:model.start()] + s[model.end():]
    else:
        s = (s[:model.start()] +
         f'  const schema = {schema_src};\n\n'
         f'  const {{ handleSubmit }} = useForm({{\n'
         f'    resolver: zodResolver(schema),\n'
         f'    // The record lives in component state; this keeps the\n'
         f'    // resolver looking at what is actually on screen.\n'
         f'    values: ({state} ?? {{}}) as z.input<typeof schema>,\n'
         f'  }});\n' +
         s[model.end():])

    # --- the <Form> wrapper -> a plain <form> ------------------------------
    form = re.search(r'[ \t]*<Form\b[\s\S]*?\n([ \t]*)>\n', s)
    if not form:
        form = re.search(r'[ \t]*<Form\b[^>]*>\n', s)
    if not form:
        return f'{path}: no <Form> wrapper'
    indent = re.match(r'[ \t]*', form.group(0)).group(0)
    if schema_src is None:
        opening = (f'{indent}<form\n'
                   f'{indent}  onSubmit={{event => {{\n'
                   f'{indent}    event.preventDefault();\n'
                   f'{indent}    {submit};\n'
                   f'{indent}  }}}}\n'
                   f'{indent}>\n')
    else:
        opening = f'{indent}<form onSubmit={{handleSubmit(() => {submit})}}>\n'
    s = s[:form.start()] + opening + s[form.end():]
    s = re.sub(r'([ \t]*)</Form>', r'\1</form>', s)

    # --- imports ----------------------------------------------------------
    s = re.sub(r"import \{ Form, Schema \} from 'rsuite';\n", '', s)
    s = re.sub(r"import \{ Schema, Form \} from 'rsuite';\n", '', s)
    # A file importing more than those two keeps its import, minus the pair.
    s = re.sub(r"(import \{[^}]*?)\bForm,\s*", r'\1', s)
    s = re.sub(r"(import \{[^}]*?)\bSchema,\s*", r'\1', s)
    if schema_src is not None:
        last = list(re.finditer(r'^import .*;$', s, re.M))[-1]
        s = (s[:last.end()] +
             "\nimport { zodResolver } from '@hookform/resolvers/zod';"
             "\nimport { useForm } from 'react-hook-form';"
             "\nimport { z } from 'zod';" +
             s[last.end():])

    if s == original:
        return f'{path}: unchanged'
    open(path, 'w').write(s)
    return f'{path}: converted'


for p in sys.argv[1:] or SCHEMAS:
    print(convert(p))
