import { ArrayField } from './fields/array-field';
import { ArticleField } from './fields/article-field';
import { ChipsField } from './fields/chips-field';
import { ColorField } from './fields/color-field';
import { DateField, DateTimeField } from './fields/date-field';
import { DiscriminatedUnionField } from './fields/discriminated-union-field';
import { EntitySelectField } from './fields/entity-select-field';
import { ImageField } from './fields/image-field';
import { MemberPlanField, MemberPlansField } from './fields/member-plan-field';
import { PageField, PagesField } from './fields/page-field';
import { PaywallField } from './fields/paywall-field';
import { TagsField } from './fields/tags-field';
import { UserField } from './fields/user-field';
import { MultiSelectField } from './fields/multi-select-field';
import { NumberField } from './fields/number-field';
import { ObjectField } from './fields/object-field';
import { RadioField } from './fields/radio-field';
import { RichTextField } from './fields/rich-text-field';
import { SecretField } from './fields/secret-field';
import { SelectField } from './fields/select-field';
import { TextField } from './fields/text-field';
import { TextareaField } from './fields/textarea-field';
import { CheckboxField, SwitchField } from './fields/toggle-field';

export const components = {
  string: TextField,
  textarea: TextareaField,
  number: NumberField,
  boolean: CheckboxField,
  switch: SwitchField,
  enum: SelectField,
  radio: RadioField,
  enumArray: MultiSelectField,
  primitiveArray: ChipsField,
  array: ArrayField,
  object: ObjectField,
  discriminatedUnion: DiscriminatedUnionField,
  date: DateField,
  dateTime: DateTimeField,
  secret: SecretField,
  color: ColorField,
  entity: EntitySelectField,
  richText: RichTextField,
  image: ImageField,
  tags: TagsField,
  page: PageField,
  pages: PagesField,
  article: ArticleField,
  paywall: PaywallField,
  memberPlan: MemberPlanField,
  memberPlans: MemberPlansField,
  user: UserField,
};

export type EditorComponents = typeof components;
