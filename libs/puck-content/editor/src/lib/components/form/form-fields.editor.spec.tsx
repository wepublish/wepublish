import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { FormContext } from '@wepublish/puck-content/website';
import { createElement, ReactElement } from 'react';

import { FormCheckboxConfig } from './form-checkbox/form-checkbox.config';
import { FormHiddenConfig } from './form-hidden/form-hidden.config';
import { FormInputConfig } from './form-input/form-input.config';
import { FormRadioGroupConfig } from './form-radio-group/form-radio-group.config';
import { FormSelectConfig } from './form-select/form-select.config';
import { FormSubmitConfig } from './form-submit/form-submit.config';
import { FormTextareaConfig } from './form-textarea/form-textarea.config';

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

const formHidden = (isEditing: boolean, className?: string) =>
  createElement(FormHiddenConfig.render, {
    id: 'FormHidden-1',
    puck: puckContext(isEditing),
    name: 'SOURCE',
    value: 'website',
    className,
  } as Parameters<typeof FormHiddenConfig.render>[0]);

const placementWarning = 'Place this inside a Form block';

describe('FormHiddenConfig', () => {
  it('shows a placeholder in the editor so it can be selected', () => {
    const { container } = insideForm(formHidden(true));

    expect(screen.getByText('Hidden field')).toBeTruthy();
    expect(screen.getByText('SOURCE = website')).toBeTruthy();
    expect(
      container.querySelector<HTMLInputElement>('input[type="hidden"]')?.value
    ).toBe('website');
  });

  it('styles the whole placeholder in the editor', () => {
    const { container } = insideForm(formHidden(true, 'styled'));

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.classList).toContain('styled');
    expect(container.firstElementChild?.textContent).toContain('Hidden field');
  });

  it('renders only the hidden input outside the editor', () => {
    const { container } = renderWithProviders(formHidden(false));

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toEqual(
      expect.objectContaining({ type: 'hidden', name: 'SOURCE' })
    );
  });
});

describe('placement warning', () => {
  const fields: Array<[string, (isEditing: boolean) => ReactElement]> = [
    [
      'FormInput',
      isEditing =>
        createElement(FormInputConfig.render, {
          id: 'FormInput-1',
          puck: puckContext(isEditing),
          name: 'EMAIL',
          label: 'Email',
          type: 'email',
        }),
    ],
    [
      'FormTextarea',
      isEditing =>
        createElement(FormTextareaConfig.render, {
          id: 'FormTextarea-1',
          puck: puckContext(isEditing),
          name: 'MESSAGE',
          label: 'Message',
        }),
    ],
    [
      'FormCheckbox',
      isEditing =>
        createElement(FormCheckboxConfig.render, {
          id: 'FormCheckbox-1',
          puck: puckContext(isEditing),
          name: 'consent',
          label: 'I agree',
        }),
    ],
    [
      'FormSelect',
      isEditing =>
        createElement(FormSelectConfig.render, {
          id: 'FormSelect-1',
          puck: puckContext(isEditing),
          name: 'TOPIC',
          label: 'Topic',
          options: topics,
        }),
    ],
    [
      'FormRadioGroup',
      isEditing =>
        createElement(FormRadioGroupConfig.render, {
          id: 'FormRadioGroup-1',
          puck: puckContext(isEditing),
          name: 'TOPIC',
          label: 'Topic',
          options: topics,
        }),
    ],
    ['FormHidden', isEditing => formHidden(isEditing)],
    [
      'FormSubmit',
      isEditing =>
        createElement(FormSubmitConfig.render, {
          id: 'FormSubmit-1',
          puck: puckContext(isEditing),
          label: 'Send',
        }),
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

    it('does not warn outside the editor', () => {
      renderWithProviders(field(false));

      expect(screen.queryByText(placementWarning)).toBeNull();
    });
  });
});
