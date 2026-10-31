import { PuckContext } from '@puckeditor/core';
import { renderWithProviders } from '@wepublish/mocks/website';
import { screen, within } from '@testing-library/react';
import { ReactElement } from 'react';

import { FormCheckboxRender } from './form-checkbox/form-checkbox.component';
import { FormHiddenRender } from './form-hidden/form-hidden.component';
import { FormInputRender } from './form-input/form-input.component';
import { FormRadioGroupRender } from './form-radio-group/form-radio-group.component';
import { FormSelectRender } from './form-select/form-select.component';
import { FormSubmitRender } from './form-submit/form-submit.component';
import { FormTextareaRender } from './form-textarea/form-textarea.component';
import { FormContext } from './form/form.context';

const puckContext = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const insideForm = (ui: ReactElement) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-1' }}>{ui}</FormContext.Provider>
  );

const topics = [
  { label: 'Politics', value: 'politics' },
  { label: 'Culture', value: 'culture' },
];

const placementWarning = 'Place this inside a Form block';

describe('FormInputRender', () => {
  it('renders a labelled input that is submitted under its name', () => {
    insideForm(
      <FormInputRender
        id="FormInput-1"
        puck={puckContext(false)}
        name="EMAIL"
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue="reader@example.com"
        helperText="We never share it"
      />
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
      <FormInputRender
        id="FormInput-1"
        puck={puckContext(false)}
        name="FNAME"
        label="First name"
        type="text"
      />
    );

    expect(
      screen.getByRole<HTMLInputElement>('textbox', { name: 'First name' })
        .required
    ).toBe(false);
  });

  it('gives every input its own id', () => {
    insideForm(
      <>
        <FormInputRender
          id="FormInput-1"
          puck={puckContext(false)}
          name="FNAME"
          label="First name"
          type="text"
        />
        <FormInputRender
          id="FormInput-2"
          puck={puckContext(false)}
          name="LNAME"
          label="Last name"
          type="text"
        />
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
      <FormTextareaRender
        id="FormTextarea-1"
        puck={puckContext(false)}
        name="MESSAGE"
        label="Message"
        rows={6}
        required
        placeholder="Your message"
        defaultValue="Hello"
      />
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
      <FormCheckboxRender
        id="FormCheckbox-1"
        puck={puckContext(false)}
        name="group[123][1]"
        label="Weekly newsletter"
        value="1"
        required
        defaultChecked
      />
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
      <FormCheckboxRender
        id="FormCheckbox-1"
        puck={puckContext(false)}
        name="consent"
        label="I agree"
      />
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
      <FormSelectRender
        id="FormSelect-1"
        puck={puckContext(false)}
        name="TOPIC"
        label="Topic"
        placeholder="Choose a topic"
        options={topics}
        required
      />
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
      <FormSelectRender
        id="FormSelect-1"
        puck={puckContext(false)}
        name="TOPIC"
        label="Topic"
        options={topics}
        defaultValue="culture"
      />
    );

    expect(
      screen.getByRole<HTMLSelectElement>('combobox', { name: 'Topic' }).value
    ).toBe('culture');
  });
});

describe('FormRadioGroupRender', () => {
  it('renders a labelled group of radios sharing one name', () => {
    insideForm(
      <FormRadioGroupRender
        id="FormRadioGroup-1"
        puck={puckContext(false)}
        name="TOPIC"
        label="Topic"
        options={topics}
        defaultValue="politics"
        required
      />
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
      <FormHiddenRender
        id="FormHidden-1"
        puck={puckContext(false)}
        name="SOURCE"
        value="website"
      />
    );

    const input = container.querySelector<HTMLInputElement>(
      'input[type="hidden"]'
    );

    expect(input?.name).toBe('SOURCE');
    expect(input?.value).toBe('website');
    expect(screen.queryByText('Hidden field')).toBeNull();
  });

  it('shows a placeholder in the editor so it can be selected', () => {
    insideForm(
      <FormHiddenRender
        id="FormHidden-1"
        puck={puckContext(true)}
        name="SOURCE"
        value="website"
      />
    );

    expect(screen.getByText('Hidden field')).toBeTruthy();
    expect(screen.getByText('SOURCE = website')).toBeTruthy();
  });

  it('adds no layout box around the hidden input on the website', () => {
    insideForm(
      <div
        role="group"
        aria-label="Form content"
      >
        <FormHiddenRender
          id="FormHidden-1"
          puck={puckContext(false)}
          name="SOURCE"
          value="website"
        />
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
      <FormSubmitRender
        id="FormSubmit-1"
        puck={puckContext(false)}
        label="Subscribe"
        color="primary"
        variant="contained"
      />
    );

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Subscribe' }).type
    ).toBe('submit');
  });
});

describe('placement warning', () => {
  const fields: Array<[string, (isEditing: boolean) => ReactElement]> = [
    [
      'FormInput',
      isEditing => (
        <FormInputRender
          id="FormInput-1"
          puck={puckContext(isEditing)}
          name="EMAIL"
          label="Email"
          type="email"
        />
      ),
    ],
    [
      'FormTextarea',
      isEditing => (
        <FormTextareaRender
          id="FormTextarea-1"
          puck={puckContext(isEditing)}
          name="MESSAGE"
          label="Message"
        />
      ),
    ],
    [
      'FormCheckbox',
      isEditing => (
        <FormCheckboxRender
          id="FormCheckbox-1"
          puck={puckContext(isEditing)}
          name="consent"
          label="I agree"
        />
      ),
    ],
    [
      'FormSelect',
      isEditing => (
        <FormSelectRender
          id="FormSelect-1"
          puck={puckContext(isEditing)}
          name="TOPIC"
          label="Topic"
          options={topics}
        />
      ),
    ],
    [
      'FormRadioGroup',
      isEditing => (
        <FormRadioGroupRender
          id="FormRadioGroup-1"
          puck={puckContext(isEditing)}
          name="TOPIC"
          label="Topic"
          options={topics}
        />
      ),
    ],
    [
      'FormHidden',
      isEditing => (
        <FormHiddenRender
          id="FormHidden-1"
          puck={puckContext(isEditing)}
          name="SOURCE"
          value="website"
        />
      ),
    ],
    [
      'FormSubmit',
      isEditing => (
        <FormSubmitRender
          id="FormSubmit-1"
          puck={puckContext(isEditing)}
          label="Send"
        />
      ),
    ],
  ];

  describe.each(fields)('%s', (_name, field) => {
    it('warns in the editor when it is placed outside a form', () => {
      renderWithProviders(field(true));

      expect(screen.getByText(placementWarning)).toBeTruthy();
    });

    it('does not warn inside a form', () => {
      insideForm(field(true));

      expect(screen.queryByText(placementWarning)).toBeNull();
    });

    it('does not warn on the website', () => {
      renderWithProviders(field(false));

      expect(screen.queryByText(placementWarning)).toBeNull();
    });
  });
});
