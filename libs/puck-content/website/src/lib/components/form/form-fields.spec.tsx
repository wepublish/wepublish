import { renderWithProviders } from '@wepublish/mocks/website';
import { screen, within } from '@testing-library/react';
import { createElement, ReactElement } from 'react';

import {
  emptyPuckBlockData,
  PuckBlockComponent,
} from '../../blocks/block.types';
import {
  FormCheckboxProps,
  FormCheckboxRender,
} from './form-checkbox/form-checkbox.component';
import {
  FormHiddenProps,
  FormHiddenRender,
} from './form-hidden/form-hidden.component';
import {
  FormInputProps,
  FormInputRender,
} from './form-input/form-input.component';
import {
  FormRadioGroupProps,
  FormRadioGroupRender,
} from './form-radio-group/form-radio-group.component';
import {
  FormSelectProps,
  FormSelectRender,
} from './form-select/form-select.component';
import {
  FormSubmitProps,
  FormSubmitRender,
} from './form-submit/form-submit.component';
import {
  FormTextareaProps,
  FormTextareaRender,
} from './form-textarea/form-textarea.component';
import { FormContext } from './form/form.context';

const block = <Props,>(
  Component: PuckBlockComponent<Props>,
  props: Props,
  className?: string
) =>
  createElement(Component, {
    id: 'Field-1',
    props,
    data: emptyPuckBlockData,
    slots: {},
    className,
  });

const insideForm = (ui: ReactElement) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-1' }}>{ui}</FormContext.Provider>
  );

const topics = [
  { label: 'Politics', value: 'politics' },
  { label: 'Culture', value: 'culture' },
];

describe('FormInputRender', () => {
  it('renders a labelled input that is submitted under its name', () => {
    insideForm(
      block<FormInputProps>(FormInputRender, {
        name: 'EMAIL',
        label: 'Email',
        type: 'email',
        required: true,
        autoComplete: 'email',
        placeholder: 'you@example.com',
        defaultValue: 'reader@example.com',
        helperText: 'We never share it',
      })
    );

    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Email',
    });

    expect(input.name).toBe('EMAIL');
    expect(input.type).toBe('email');
    expect(input.required).toBe(true);
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(input.placeholder).toBe('you@example.com');
    expect(input.value).toBe('reader@example.com');
    expect(input.id).not.toBe('');
    expect(screen.getByText('We never share it')).toBeTruthy();
  });

  it('is optional unless required', () => {
    insideForm(
      block<FormInputProps>(FormInputRender, {
        name: 'FNAME',
        label: 'First name',
        type: 'text',
      })
    );

    expect(
      screen.getByRole<HTMLInputElement>('textbox', { name: 'First name' })
        .required
    ).toBe(false);
  });

  it('gives every input its own id', () => {
    insideForm(
      <>
        {block<FormInputProps>(FormInputRender, {
          name: 'FNAME',
          label: 'First name',
          type: 'text',
        })}
        {block<FormInputProps>(FormInputRender, {
          name: 'LNAME',
          label: 'Last name',
          type: 'text',
        })}
      </>
    );

    expect(screen.getByRole('textbox', { name: 'First name' }).id).not.toBe(
      screen.getByRole('textbox', { name: 'Last name' }).id
    );
  });
});

describe('FormTextareaRender', () => {
  it('renders a labelled multi-line input', () => {
    insideForm(
      block<FormTextareaProps>(FormTextareaRender, {
        name: 'MESSAGE',
        label: 'Message',
        rows: 6,
        required: true,
        placeholder: 'Your message',
        defaultValue: 'Hello',
      })
    );

    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', {
      name: 'Message',
    });

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.name).toBe('MESSAGE');
    expect(textarea.getAttribute('rows')).toBe('6');
    expect(textarea.required).toBe(true);
    expect(textarea.placeholder).toBe('Your message');
    expect(textarea.value).toBe('Hello');
  });
});

describe('FormCheckboxRender', () => {
  it('renders a labelled checkbox that sends its value when checked', () => {
    insideForm(
      block<FormCheckboxProps>(FormCheckboxRender, {
        name: 'group[123][1]',
        label: 'Weekly newsletter',
        value: '1',
        required: true,
        defaultChecked: true,
      })
    );

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Weekly newsletter',
    });

    expect(checkbox.name).toBe('group[123][1]');
    expect(checkbox.value).toBe('1');
    expect(checkbox.required).toBe(true);
    expect(checkbox.checked).toBe(true);
  });

  it('is unchecked by default', () => {
    insideForm(
      block<FormCheckboxProps>(FormCheckboxRender, {
        name: 'consent',
        label: 'I agree',
      })
    );

    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'I agree' })
        .checked
    ).toBe(false);
  });
});

describe('FormSelectRender', () => {
  it('renders a labelled native select with an empty choice first', () => {
    insideForm(
      block<FormSelectProps>(FormSelectRender, {
        name: 'TOPIC',
        label: 'Topic',
        placeholder: 'Choose a topic',
        options: topics,
        required: true,
      })
    );

    const select = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Topic',
    });

    expect(select.tagName).toBe('SELECT');
    expect(select.name).toBe('TOPIC');
    expect(select.required).toBe(true);
    expect(select.value).toBe('');
    expect(
      Array.from(select.options).map(option => [option.value, option.text])
    ).toEqual([
      ['', 'Choose a topic'],
      ['politics', 'Politics'],
      ['culture', 'Culture'],
    ]);
  });

  it('preselects the default value', () => {
    insideForm(
      block<FormSelectProps>(FormSelectRender, {
        name: 'TOPIC',
        label: 'Topic',
        options: topics,
        defaultValue: 'culture',
      })
    );

    expect(
      screen.getByRole<HTMLSelectElement>('combobox', { name: 'Topic' }).value
    ).toBe('culture');
  });
});

describe('FormRadioGroupRender', () => {
  it('renders a labelled group of radios sharing one name', () => {
    insideForm(
      block<FormRadioGroupProps>(FormRadioGroupRender, {
        name: 'TOPIC',
        label: 'Topic',
        options: topics,
        defaultValue: 'politics',
        required: true,
      })
    );

    const group = screen.getByRole('radiogroup', { name: 'Topic' });
    const radios = within(group).getAllByRole<HTMLInputElement>('radio');

    expect(radios.map(radio => [radio.name, radio.value])).toEqual([
      ['TOPIC', 'politics'],
      ['TOPIC', 'culture'],
    ]);
    expect(
      within(group).getByRole<HTMLInputElement>('radio', { name: 'Politics' })
        .checked
    ).toBe(true);
    expect(radios.every(radio => radio.required)).toBe(true);
  });
});

describe('FormHiddenRender', () => {
  it('renders a hidden input with a fixed value', () => {
    const { container } = insideForm(
      block<FormHiddenProps>(FormHiddenRender, {
        name: 'SOURCE',
        value: 'website',
      })
    );

    const input = container.querySelector<HTMLInputElement>(
      'input[type="hidden"]'
    );

    expect(input?.name).toBe('SOURCE');
    expect(input?.value).toBe('website');
    expect(screen.queryByText('Hidden field')).toBeNull();
  });

  it('adds no layout box around the hidden input', () => {
    insideForm(
      <div
        role="group"
        aria-label="Form content"
      >
        {block<FormHiddenProps>(FormHiddenRender, {
          name: 'SOURCE',
          value: 'website',
        })}
      </div>
    );

    const formContent = screen.getByRole('group', { name: 'Form content' });

    expect(formContent.children).toHaveLength(1);
    expect(formContent.firstElementChild).toEqual(
      expect.objectContaining({ type: 'hidden', name: 'SOURCE' })
    );
  });
});

describe('FormSubmitRender', () => {
  it('renders a submit button', () => {
    insideForm(
      block<FormSubmitProps>(FormSubmitRender, {
        label: 'Subscribe',
        color: 'primary',
        variant: 'contained',
      })
    );

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Subscribe' }).type
    ).toBe('submit');
  });
});

describe('form fields', () => {
  const fields: Array<[string, (className?: string) => ReactElement]> = [
    [
      'FormInput',
      className =>
        block<FormInputProps>(
          FormInputRender,
          { name: 'EMAIL', label: 'Email', type: 'email' },
          className
        ),
    ],
    [
      'FormTextarea',
      className =>
        block<FormTextareaProps>(
          FormTextareaRender,
          { name: 'MESSAGE', label: 'Message' },
          className
        ),
    ],
    [
      'FormCheckbox',
      className =>
        block<FormCheckboxProps>(
          FormCheckboxRender,
          { name: 'consent', label: 'I agree' },
          className
        ),
    ],
    [
      'FormSelect',
      className =>
        block<FormSelectProps>(
          FormSelectRender,
          { name: 'TOPIC', label: 'Topic', options: topics },
          className
        ),
    ],
    [
      'FormRadioGroup',
      className =>
        block<FormRadioGroupProps>(
          FormRadioGroupRender,
          { name: 'TOPIC', label: 'Topic', options: topics },
          className
        ),
    ],
    [
      'FormHidden',
      className =>
        block<FormHiddenProps>(
          FormHiddenRender,
          { name: 'SOURCE', value: 'website' },
          className
        ),
    ],
    [
      'FormSubmit',
      className =>
        block<FormSubmitProps>(FormSubmitRender, { label: 'Send' }, className),
    ],
  ];

  describe.each(fields)('%s', (_name, field) => {
    it('renders one root element that carries the class name', () => {
      const { container } = renderWithProviders(field('styled'));

      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild?.classList).toContain('styled');
    });

    it('shows no editor hint outside a form', () => {
      renderWithProviders(field());

      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.queryByText('Place this inside a Form block')).toBeNull();
    });
  });
});
