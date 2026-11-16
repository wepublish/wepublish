import { act, render } from '@testing-library/react';
import {
  useFieldArray,
  useForm,
  type UseFieldArrayReturn,
  type UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod/v4';
import { createTestForm } from '../testing/form-test-kit';
import { getChangedEntries, getChangedValues } from './changed-values';
import type { SchemaForm } from './form-types';
import { withKind } from './kind';
import { isSameValue } from './same-value';

type Values = {
  title: string;
  starts: Date | null;
  address: { street: string; zip: string };
  actions: { label: string }[];
};

const renderForm = () => {
  const handles: {
    form?: UseFormReturn<Values>;
    actions?: UseFieldArrayReturn<Values, 'actions'>;
  } = {};

  function View() {
    const form = useForm<Values>({
      defaultValues: {
        title: 't',
        starts: new Date(2030, 0, 1),
        address: { street: 's', zip: 'z' },
        actions: [{ label: 'a' }, { label: 'b' }],
      },
    });

    handles.form = form;
    handles.actions = useFieldArray({ control: form.control, name: 'actions' });

    return null;
  }

  render(<View />);

  const { form, actions } = handles;

  if (!form || !actions) {
    throw new Error('The form did not render.');
  }

  return { form, actions };
};

const testForm = createTestForm();

const groupSchema = z.object({
  title: z.string(),
  seo: z.object({ slug: z.string().min(1), title: z.string() }).optional(),
  address: z.object({ street: z.string() }).nullable(),
  data: withKind(z.custom<{ note?: string }>(), 'json').nullable(),
});

const renderSchemaForm = () => {
  const handles: { schemaForm?: SchemaForm<typeof groupSchema> } = {};

  function View() {
    handles.schemaForm = testForm.useSchemaForm(groupSchema);

    return null;
  }

  render(<View />);

  if (!handles.schemaForm) {
    throw new Error('The form did not render.');
  }

  return handles.schemaForm.form;
};

describe('isSameValue', () => {
  it('compares plain objects and arrays deeply and dates by time', () => {
    expect(isSameValue({ a: [1, { b: 'x' }] }, { a: [1, { b: 'x' }] })).toBe(
      true
    );
    expect(isSameValue({ a: [1] }, { a: [2] })).toBe(false);
    expect(isSameValue(new Date(2030, 0, 1), new Date(2030, 0, 1))).toBe(true);
  });

  it('compares files, blobs, maps and class instances by identity', () => {
    const blob = new Blob(['a']);
    const map = new Map([['a', 1]]);

    expect(isSameValue(new Blob(['a']), new Blob(['b']))).toBe(false);
    expect(isSameValue(blob, blob)).toBe(true);
    expect(isSameValue(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
    expect(isSameValue(map, map)).toBe(true);
  });

  it('never equates a date or an array with a plain object', () => {
    expect(isSameValue(new Date(2030, 0, 1), {})).toBe(false);
    expect(isSameValue({}, new Date(2030, 0, 1))).toBe(false);
    expect(isSameValue([], {})).toBe(false);
  });
});

describe('getChangedValues', () => {
  it('is empty for an untouched form', () => {
    const { form } = renderForm();

    expect(getChangedValues(form)).toEqual({});
  });

  it('compares dates by time', async () => {
    const { form } = renderForm();

    await act(async () => {
      form.setValue('starts', new Date(2030, 0, 1));
    });

    expect(getChangedValues(form)).toEqual({});
  });

  it('sends whole top-level values', async () => {
    const { form } = renderForm();

    await act(async () => {
      form.setValue('address.zip', 'y');
      form.setValue('title', 'u');
    });

    expect(getChangedValues(form)).toEqual({
      title: 'u',
      address: { street: 's', zip: 'y' },
    });
  });

  it('sees array removals', async () => {
    const { form, actions } = renderForm();

    await act(async () => {
      actions.remove(0);
    });

    expect(getChangedValues(form)).toEqual({ actions: [{ label: 'b' }] });
  });

  it('treats a blank optional or nullable group as equal to an absent one', async () => {
    const form = renderSchemaForm();

    await act(async () => {
      form.setValue('seo', undefined);
      form.setValue('address', null);
    });

    expect(getChangedValues(form)).toEqual({});

    await act(async () => {
      form.setValue('seo', { slug: '', title: '' });
      form.setValue('address', { street: '' });
    });

    expect(getChangedValues(form)).toEqual({});

    await act(async () => {
      form.setValue('seo', { slug: 'a', title: '' });
    });

    expect(getChangedValues(form)).toEqual({ seo: { slug: 'a', title: '' } });
  });

  it('compares custom kinds whole even when they hold a blank object', async () => {
    const form = renderSchemaForm();

    await act(async () => {
      form.setValue('data', {});
    });

    expect(getChangedValues(form)).toEqual({ data: {} });
  });

  it('is empty again after a reset to the current values', async () => {
    const { form } = renderForm();

    await act(async () => {
      form.setValue('title', 'u');
    });
    await act(async () => {
      form.reset(form.getValues());
    });

    expect(getChangedValues(form)).toEqual({});
  });
});

describe('getChangedEntries', () => {
  it('is empty for an untouched form', () => {
    const { form } = renderForm();

    expect(getChangedEntries(form)).toEqual([]);
  });

  it('returns the value before and after for each changed top-level key', async () => {
    const { form } = renderForm();

    await act(async () => {
      form.setValue('address.zip', 'y');
      form.setValue('title', 'u');
    });

    expect(getChangedEntries(form)).toEqual([
      { key: 'title', before: 't', after: 'u' },
      {
        key: 'address',
        before: { street: 's', zip: 'z' },
        after: { street: 's', zip: 'y' },
      },
    ]);
  });

  it('ignores a blank optional group and compares dates by time', async () => {
    const form = renderSchemaForm();

    await act(async () => {
      form.setValue('seo', { slug: '', title: '' });
      form.setValue('address', { street: '' });
    });

    expect(getChangedEntries(form)).toEqual([]);

    const { form: dated } = renderForm();

    await act(async () => {
      dated.setValue('starts', new Date(2030, 0, 1));
    });

    expect(getChangedEntries(dated)).toEqual([]);
  });
});
