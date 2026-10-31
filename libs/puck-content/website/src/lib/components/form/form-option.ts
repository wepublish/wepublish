export type FormOption = {
  label: string;
  value: string;
};

export const defaultFormOption = (index: number): FormOption => ({
  label: `Option ${index + 1}`,
  value: `option-${index + 1}`,
});

export const defaultFormOptions: FormOption[] = [
  defaultFormOption(0),
  defaultFormOption(1),
];
