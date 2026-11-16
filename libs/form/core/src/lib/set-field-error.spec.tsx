import { act, render } from '@testing-library/react';
import {
  useForm,
  useFormState,
  type FieldErrors,
  type UseFormReturn,
} from 'react-hook-form';
import { setFieldError } from './set-field-error';

type Values = { slug: string; title: string };

const renderForm = () => {
  const handles: {
    form?: UseFormReturn<Values>;
    errors?: FieldErrors<Values>;
  } = {};

  function View() {
    const form = useForm<Values>({ defaultValues: { slug: '', title: '' } });

    handles.form = form;
    handles.errors = useFormState({ control: form.control }).errors;

    return null;
  }

  render(<View />);

  const { form } = handles;

  if (!form) {
    throw new Error('The form did not render.');
  }

  return { form, errors: () => handles.errors };
};

describe('setFieldError', () => {
  it('sets a translated key with params on a field', async () => {
    const { form } = renderForm();

    await act(async () => {
      setFieldError(form, 'slug', 'consents.uniqueConstraint', { slug: 'a' });
    });

    expect(form.getFieldState('slug').error).toMatchObject({
      type: 'server',
      message: 'consents.uniqueConstraint',
      params: { slug: 'a' },
    });
  });

  it('clears the params of the error it replaces', async () => {
    const { form } = renderForm();

    await act(async () => {
      setFieldError(form, 'slug', 'form.errors.too_small.string.min', {
        minimum: 3,
      });
    });
    await act(async () => {
      setFieldError(form, 'slug', 'consents.uniqueConstraint');
    });

    expect(form.getFieldState('slug').error).toEqual(
      expect.objectContaining({
        message: 'consents.uniqueConstraint',
        params: undefined,
      })
    );
  });

  it('sets root errors', async () => {
    const { form, errors } = renderForm();

    await act(async () => {
      setFieldError(form, 'root.server', 'form.errors.server');
    });

    expect(errors()?.root).toMatchObject({
      server: { message: 'form.errors.server' },
    });
  });
});
