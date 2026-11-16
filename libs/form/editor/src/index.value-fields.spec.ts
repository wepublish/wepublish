import * as formEditor from './index';

describe('@wepublish/form/editor value fields', () => {
  it('exports the value field components', () => {
    expect(Object.keys(formEditor)).toEqual(
      expect.arrayContaining([
        'DateField',
        'DateTimeField',
        'ColorField',
        'SecretField',
        'EntitySelectField',
        'RichTextField',
        'CurrencyField',
      ])
    );
  });

  it('maps the value kinds to their components and leaves the currency to a per-call binding', () => {
    expect(formEditor.components).toMatchObject({
      date: formEditor.DateField,
      dateTime: formEditor.DateTimeField,
      color: formEditor.ColorField,
      secret: formEditor.SecretField,
      entity: formEditor.EntitySelectField,
      richText: formEditor.RichTextField,
    });
    expect(Object.values(formEditor.components)).not.toContain(
      formEditor.CurrencyField
    );
  });
});
