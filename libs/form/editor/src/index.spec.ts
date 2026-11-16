import * as formEditor from './index';

describe('@wepublish/form/editor', () => {
  it('exports the editor form, its fields and the core helpers form authors need', () => {
    expect(Object.keys(formEditor)).toEqual(
      expect.arrayContaining([
        'editorForm',
        'components',
        'formFields',
        'FormErrorSummary',
        'LoadState',
        'TextField',
        'TextareaField',
        'NumberField',
        'SwitchField',
        'CheckboxField',
        'SelectField',
        'RadioField',
        'useField',
        'useArrayField',
        'useObjectField',
        'useUnionField',
        'useFormStatus',
        'useFieldErrors',
        'setFieldError',
        'crossField',
        'getChangedValues',
        'bindComponent',
        'fieldComponent',
      ])
    );
  });

  it('exports the form view kit', () => {
    expect(Object.keys(formEditor)).toEqual(
      expect.arrayContaining([
        'formView',
        'useCreateForm',
        'useEditForm',
        'useSingletonForm',
        'useQueryLoader',
        'useRouteDrawer',
        'useFormView',
        'uniqueConstraint',
        'uniqueViolationOf',
        'FormPage',
        'FormPageHeader',
        'FormDrawer',
        'FormDrawerPanel',
        'FormRoot',
        'FormBody',
        'FormSaveActions',
        'FormSection',
        'FormRow',
        'FormToggleGroup',
      ])
    );
  });

  it('offers the form only through editorForm and the kinds only through formFields', () => {
    expect(formEditor).not.toHaveProperty('useSchemaForm');
    expect(formEditor).not.toHaveProperty('Form');
    expect(formEditor).not.toHaveProperty('fieldsFor');
    expect(formEditor).not.toHaveProperty('withKind');
    expect(Object.keys(formEditor.editorForm)).toEqual(
      expect.arrayContaining(['useSchemaForm', 'Form', 'fieldsFor'])
    );
  });

  it('wires the editor form to the editor components', () => {
    expect(formEditor.components).toMatchObject({
      string: formEditor.TextField,
      textarea: formEditor.TextareaField,
      number: formEditor.NumberField,
      boolean: formEditor.CheckboxField,
      switch: formEditor.SwitchField,
      enum: formEditor.SelectField,
      radio: formEditor.RadioField,
    });
  });
});
