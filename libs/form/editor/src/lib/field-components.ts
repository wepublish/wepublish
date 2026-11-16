import { fieldComponent, type OptionValue } from '@wepublish/form/core';

import { ArticleField as Article } from './fields/article-field';
import { ChipsField as Chips } from './fields/chips-field';
import { ColorField as Color } from './fields/color-field';
import { CurrencyField as Currency } from './fields/currency-field';
import {
  DateField as DateInput,
  DateTimeField as DateTimeInput,
} from './fields/date-field';
import { EntitySelectField as EntitySelect } from './fields/entity-select-field';
import { ImageField as Image } from './fields/image-field';
import {
  MemberPlanField as MemberPlan,
  MemberPlansField as MemberPlans,
} from './fields/member-plan-field';
import { MultiSelectField as MultiSelect } from './fields/multi-select-field';
import { NumberField as NumberInput } from './fields/number-field';
import { PageField as Page, PagesField as Pages } from './fields/page-field';
import { PaywallField as Paywall } from './fields/paywall-field';
import { RadioField as Radio } from './fields/radio-field';
import { SecretField as Secret } from './fields/secret-field';
import { SelectField as Select } from './fields/select-field';
import { TagsField as Tags } from './fields/tags-field';
import { TextField as Text } from './fields/text-field';
import { TextareaField as Textarea } from './fields/textarea-field';
import {
  CheckboxField as Checkbox,
  SwitchField as Switch,
} from './fields/toggle-field';
import { UserField as User } from './fields/user-field';

export const TextField = fieldComponent<string | null>()(Text);
export const TextareaField = fieldComponent<string | null>()(Textarea);
export const SecretField = fieldComponent<string | null>()(Secret);
export const ColorField = fieldComponent<string | null>()(Color);
export const NumberField = fieldComponent<number | null>()(NumberInput);
export const CurrencyField = fieldComponent<number | null>()(Currency);
export const SwitchField = fieldComponent<boolean | null>()(Switch);
export const CheckboxField = fieldComponent<boolean | null>()(Checkbox);
export const DateField = fieldComponent<Date | null>()(DateInput);
export const DateTimeField = fieldComponent<Date | null>()(DateTimeInput);
export const SelectField = fieldComponent<OptionValue | null>()(Select);
export const RadioField = fieldComponent<OptionValue | null>()(Radio);
export const MultiSelectField =
  fieldComponent<readonly OptionValue[]>()(MultiSelect);
export const ChipsField = fieldComponent<readonly string[]>()(Chips);
export const EntitySelectField = fieldComponent<object | null>()(EntitySelect);
export const ImageField = fieldComponent<{ id: string } | null>()(Image);
export const UserField = fieldComponent<{ id: string } | null>()(User);
export const PageField = fieldComponent<string | null>()(Page);
export const ArticleField = fieldComponent<string | null>()(Article);
export const PaywallField = fieldComponent<string | null>()(Paywall);
export const MemberPlanField = fieldComponent<string | null>()(MemberPlan);
export const PagesField = fieldComponent<readonly string[]>()(Pages);
export const TagsField = fieldComponent<readonly string[]>()(Tags);
export const MemberPlansField =
  fieldComponent<readonly string[]>()(MemberPlans);
