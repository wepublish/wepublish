import * as v from 'valibot';

export const isBrandAction = (
  input: unknown
): input is v.BrandAction<any, any> => {
  return (input as any).type === 'brand';
};

export const hasBrandAction = (input: unknown): boolean => {
  if (isBrandAction(input)) {
    return input.name;
  }

  if (!isPipeAction(input)) {
    return false;
  }

  const results = input.pipe.find(schem => {
    return hasBrandAction(schem);
  });

  return !!results;
};

export const isPipeAction = (
  input: unknown
): input is v.SchemaWithPipe<
  [
    v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
    v.PipeItem<unknown, unknown, v.BaseIssue<unknown>>,
  ]
> => {
  return 'pipe' in (input as any);
};

export const isDescriptionAction = (
  input: unknown
): input is v.DescriptionAction<unknown, string> => {
  return (input as any).type === 'description';
};

export const isTitleAction = (
  input: unknown
): input is v.TitleAction<unknown, string> => {
  return (input as any).type === 'title';
};
