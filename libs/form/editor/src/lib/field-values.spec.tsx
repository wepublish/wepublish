import { TagType } from '@wepublish/editor/api';
import { z } from 'zod/v4';

import {
  bindComponent,
  CheckboxField,
  ColorField,
  CurrencyField,
  DateField,
  DateTimeField,
  editorForm,
  formFields,
  NumberField,
  PageField,
  RadioField,
  SecretField,
  SelectField,
  SwitchField,
  TagsField,
  TextareaField,
  TextField,
} from '../index';

const schema = z.object({
  title: z.string(),
  lead: z.string().nullish(),
  amount: z.number(),
  limit: z.number().nullish(),
  active: z.boolean(),
  startsAt: z.date(),
  status: z.enum(['draft', 'published']),
  tags: formFields.tags(TagType.Event),
  page: formFields.page(),
});

const { Field } = editorForm.fieldsFor(schema);

export function MatchingBoundFields() {
  return [
    Field({ name: 'title', component: bindComponent(TextareaField) }),
    Field({
      name: 'lead',
      component: bindComponent(TextField, { type: 'password' }),
    }),
    Field({ name: 'lead', component: bindComponent(SecretField) }),
    Field({ name: 'title', component: bindComponent(ColorField) }),
    Field({
      name: 'amount',
      component: bindComponent(CurrencyField, { currency: 'CHF' }),
    }),
    Field({
      name: 'limit',
      component: bindComponent(NumberField, { unit: 'min' }),
    }),
    Field({ name: 'active', component: bindComponent(CheckboxField) }),
    Field({ name: 'active', component: bindComponent(SwitchField) }),
    Field({ name: 'startsAt', component: bindComponent(DateTimeField) }),
    Field({ name: 'startsAt', component: bindComponent(DateField) }),
    Field({
      name: 'status',
      component: bindComponent(RadioField, { row: true }),
    }),
    Field({
      name: 'status',
      component: bindComponent(SelectField, { searchable: true }),
    }),
    Field({ name: 'title', component: bindComponent(PageField) }),
  ];
}

export function MismatchedBoundFields() {
  return [
    Field({
      name: 'title',
      // @ts-expect-error a currency field cannot edit a string
      component: bindComponent(CurrencyField, { currency: 'CHF' }),
    }),
    // @ts-expect-error a text field cannot edit a number
    Field({ name: 'amount', component: bindComponent(TextField) }),
    // @ts-expect-error a switch cannot edit a date
    Field({ name: 'startsAt', component: bindComponent(SwitchField) }),
    // @ts-expect-error a date field cannot edit a boolean
    Field({ name: 'active', component: bindComponent(DateField) }),
    // @ts-expect-error a single page picker cannot edit a list of tags
    Field({ name: 'tags', component: bindComponent(PageField) }),
    // @ts-expect-error a tags picker cannot edit a single page
    Field({ name: 'page', component: bindComponent(TagsField) }),
  ];
}

describe('field value types', () => {
  it('exports components that can be bound', () => {
    expect(bindComponent(CurrencyField, { currency: 'CHF' }).props).toEqual({
      currency: 'CHF',
    });
  });
});
