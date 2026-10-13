import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LoginStatus } from '@wepublish/editor/api';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
  ContentGateForm,
  ContentGateFormData,
  createContentGateSchema,
} from './content-gate-form';

const t = ((key: string) => key) as any;

const gate: ContentGateFormData = {
  name: 'Registration wall',
  active: true,
  audience: LoginStatus.LoggedOut,
  freeArticles: 3,
  softGateArticles: 2,
  previewBlocks: 3,
  meterWindowDays: 30,
  ctaLabel: null,
  ctaUrl: null,
  softDescription: null,
  hardDescription: null,
  newsletterParams: [{ key: 'utm_medium', value: 'email' }],
  newsletterNeverGate: false,
  newsletterFreeArticles: 0,
};

/** Renders what the form currently holds, so tests read it like a user would. */
const Values = () => {
  const values = useWatch<ContentGateFormData>();

  return <pre data-testid="values">{JSON.stringify(values)}</pre>;
};

const Harness = () => {
  const form = useForm<ContentGateFormData>({ defaultValues: gate });

  return (
    <FormProvider {...form}>
      <ContentGateForm />
      <Values />
    </FormProvider>
  );
};

const renderForm = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MockedProvider>
        <Harness />
      </MockedProvider>
    </ThemeProvider>
  );

const values = (): ContentGateFormData =>
  JSON.parse(screen.getByTestId('values').textContent ?? '{}');

describe('ContentGateForm', () => {
  it('shows from which article on the hard gate appears', () => {
    renderForm();

    expect(screen.getByTestId('hard-gate-from')).toHaveTextContent('6');
  });

  it('updates the hard gate article when the free articles change', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('contentGate.form.freeArticles'), {
      target: { value: '5' },
    });

    expect(screen.getByTestId('hard-gate-from')).toHaveTextContent('8');
    expect(values().freeArticles).toBe(5);
  });

  it('adds a newsletter param', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('add-newsletter-param'));

    expect(values().newsletterParams).toEqual([
      { key: 'utm_medium', value: 'email' },
      { key: '', value: '' },
    ]);
  });

  it('removes a newsletter param', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('remove-newsletter-param-0'));

    expect(values().newsletterParams).toEqual([]);
  });

  it('offers anonymous readers and non-subscribers as audience, as before', () => {
    renderForm();

    const radios = screen.getAllByRole('radio') as HTMLInputElement[];

    expect(radios.map(({ value }) => value)).toEqual([
      LoginStatus.LoggedOut,
      LoginStatus.Unsubscribed,
    ]);
    expect(
      screen.getByText('contentGate.audience.NON_SUBSCRIBERS')
    ).toBeInTheDocument();

    fireEvent.click(radios[1]);

    expect(values().audience).toBe(LoginStatus.Unsubscribed);
  });

  it('disables the newsletter free articles when newsletter readers are never gated', () => {
    const { container } = renderForm();

    const freeArticles = container.querySelector(
      'input[name="newsletterFreeArticles"]'
    );
    expect(freeArticles).toBeEnabled();

    fireEvent.click(
      screen.getByLabelText('contentGate.form.newsletterNeverGate')
    );

    expect(freeArticles).toBeDisabled();
  });
});

describe('createContentGateSchema', () => {
  const errorsOf = (data: Partial<ContentGateFormData>) => {
    const result = createContentGateSchema(t).safeParse({ ...gate, ...data });

    return result.success ?
        []
      : [...new Set(result.error.issues.map(({ path }) => path[0]))];
  };

  it('accepts a valid gate', () => {
    expect(errorsOf({})).toEqual([]);
  });

  it('requires a name', () => {
    expect(errorsOf({ name: '' })).toEqual(['name']);
  });

  it.each([
    'freeArticles',
    'softGateArticles',
    'previewBlocks',
    'meterWindowDays',
    'newsletterFreeArticles',
  ])('rejects a negative %s', field => {
    expect(errorsOf({ [field]: -1 })).toEqual([field]);
  });

  it('accepts an empty meter window', () => {
    expect(errorsOf({ meterWindowDays: null })).toEqual([]);
  });

  it.each(['/registrieren', 'https://example.com/abo'])(
    'accepts %s as call to action url',
    ctaUrl => {
      expect(errorsOf({ ctaUrl })).toEqual([]);
    }
  );

  it('rejects a call to action url that is neither a path nor a url', () => {
    expect(errorsOf({ ctaUrl: 'registrieren' })).toEqual(['ctaUrl']);
  });
});
