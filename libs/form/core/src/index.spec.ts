import * as formCore from './index';

describe('@wepublish/form/core', () => {
  it('exports the runtime API', () => {
    expect(Object.keys(formCore).sort()).toEqual(
      [
        'LoadState',
        'bindComponent',
        'clearedValue',
        'createForm',
        'crossField',
        'fieldComponent',
        'fieldMeta',
        'fieldOptions',
        'formErrorKeys',
        'getChangedEntries',
        'getChangedValues',
        'isRequired',
        'resolveKind',
        'schemaAt',
        'setFieldError',
        'topLevelKeys',
        'useArrayField',
        'useField',
        'useFieldErrors',
        'useFormErrorSummary',
        'useFormStatus',
        'useObjectField',
        'useUnionField',
        'withKind',
      ].sort()
    );
  });
});
