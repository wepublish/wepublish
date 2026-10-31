export const formComponentNames = [
  'Form',
  'FormInput',
  'FormTextarea',
  'FormCheckbox',
  'FormSelect',
  'FormRadioGroup',
  'FormHidden',
  'FormSubmit',
] as const;

export type FormComponentName = (typeof formComponentNames)[number];
