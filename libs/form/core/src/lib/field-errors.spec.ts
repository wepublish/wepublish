import { fieldErrorOf, flattenErrors } from './field-errors';

const required = {
  type: 'too_small',
  message: 'form.errors.required',
  params: { minimum: 1 },
};
const invalid = {
  type: 'invalid_format',
  message: 'form.errors.invalid_format.url',
};

describe('fieldErrorOf', () => {
  it('returns the error of a leaf', () => {
    expect(fieldErrorOf(required, false)).toBe(required);
  });

  it('is undefined without an error', () => {
    expect(fieldErrorOf(undefined, false)).toBeUndefined();
    expect(fieldErrorOf(undefined, true)).toBeUndefined();
  });

  it('picks the first entry of a per-index error array', () => {
    expect(fieldErrorOf([undefined, invalid, required], false)).toBe(invalid);
  });

  it('finds errors nested inside a leaf value', () => {
    expect(fieldErrorOf({ id: required }, false)).toBe(required);
  });

  it('reads the root error of an array', () => {
    const errors = Object.assign([undefined, { label: invalid }], {
      root: required,
    });

    expect(fieldErrorOf(errors, true)).toBe(required);
  });

  it('reads an array-level error stored at the array itself', () => {
    expect(fieldErrorOf(required, true)).toBe(required);
  });

  it('ignores the errors of children in a container', () => {
    expect(fieldErrorOf([undefined, { label: invalid }], true)).toBeUndefined();
    expect(fieldErrorOf({ url: invalid }, true)).toBeUndefined();
  });
});

describe('flattenErrors', () => {
  it('lists every error with its path', () => {
    const errors = {
      title: required,
      link: { url: invalid },
      actions: Object.assign([undefined, { label: invalid }], {
        root: required,
      }),
      root: { schema: { type: 'custom', message: 'event.rule' } },
    };

    expect(flattenErrors(errors).map(entry => entry.path)).toEqual([
      'title',
      'link.url',
      'actions.1.label',
      'actions.root',
      'root.schema',
    ]);
  });

  it('keeps the error object', () => {
    expect(flattenErrors({ title: required })).toEqual([
      { path: 'title', error: required },
    ]);
  });

  it('does not walk into the ref of an error', () => {
    const ref = { focus: () => undefined, name: 'title' };

    expect(flattenErrors({ title: { ...required, ref } })).toHaveLength(1);
  });

  it('keeps children named like error keys', () => {
    expect(
      flattenErrors({ link: { type: invalid } }).map(entry => entry.path)
    ).toEqual(['link.type']);
  });

  it('prefixes the paths', () => {
    expect(
      flattenErrors({ url: invalid }, 'link').map(entry => entry.path)
    ).toEqual(['link.url']);
  });
});
