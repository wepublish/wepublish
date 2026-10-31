import { ComponentConfig } from '@puckeditor/core';

import { formComponentNames } from './form-components';
import { formOptionsField } from './form-options';
import { FormCheckboxConfig } from './form-checkbox/form-checkbox.config';
import { FormHiddenConfig } from './form-hidden/form-hidden.config';
import { FormInputConfig } from './form-input/form-input.config';
import { FormRadioGroupConfig } from './form-radio-group/form-radio-group.config';
import { FormSelectConfig } from './form-select/form-select.config';
import { FormSubmitConfig } from './form-submit/form-submit.config';
import { FormTextareaConfig } from './form-textarea/form-textarea.config';
import { FormConfig } from './form/form.config';

const configs = {
  Form: FormConfig,
  FormInput: FormInputConfig,
  FormTextarea: FormTextareaConfig,
  FormCheckbox: FormCheckboxConfig,
  FormSelect: FormSelectConfig,
  FormRadioGroup: FormRadioGroupConfig,
  FormHidden: FormHiddenConfig,
  FormSubmit: FormSubmitConfig,
} as Record<string, ComponentConfig>;

describe('form component configs', () => {
  it('names every form component', () => {
    expect([...formComponentNames]).toEqual(Object.keys(configs));
  });

  describe.each(Object.entries(configs))('%s', (_name, config) => {
    it('tells the AI how to use it', () => {
      expect(config.ai?.instructions).toEqual(expect.any(String));
    });

    it('has default props for every field', () => {
      expect(Object.keys(config.defaultProps ?? {}).sort()).toEqual(
        Object.keys(config.fields ?? {}).sort()
      );
    });
  });
});

describe('FormConfig', () => {
  it('does not allow blocks that bring their own form inside its content', () => {
    expect(FormConfig.fields?.content).toEqual(
      expect.objectContaining({
        type: 'slot',
        disallow: ['Form', 'MailchimpForm', 'Subscribe'],
      })
    );
  });

  it('tells the AI to keep blocks with their own form out of it', () => {
    expect(FormConfig.ai?.instructions).toContain('MailchimpForm');
    expect(FormConfig.ai?.instructions).toContain('Subscribe');
  });

  it('posts by default', () => {
    expect(FormConfig.defaultProps).toEqual(
      expect.objectContaining({ method: 'post', target: '_self' })
    );
  });

  it('starts as a Mailchimp sign-up with an email input and a submit button', () => {
    expect(FormConfig.defaultProps?.content).toEqual([
      {
        type: 'FormInput',
        props: expect.objectContaining({
          name: 'EMAIL',
          type: 'email',
          required: true,
          autoComplete: 'email',
        }),
      },
      {
        type: 'FormSubmit',
        props: expect.objectContaining({ label: expect.any(String) }),
      },
    ]);
  });

  it('lets Puck give every starter block a fresh id', () => {
    expect(
      FormConfig.defaultProps?.content.every(item => !('id' in item.props))
    ).toBe(true);
  });
});

describe('formOptionsField', () => {
  it('summarises an option by its label', () => {
    expect(
      formOptionsField.getItemSummary({ label: 'Politics', value: 'p' }, 0)
    ).toBe('Politics');
  });

  it('falls back to the value and then the position', () => {
    expect(formOptionsField.getItemSummary({ label: '', value: 'p' }, 0)).toBe(
      'p'
    );
    expect(formOptionsField.getItemSummary({ label: '', value: '' }, 2)).toBe(
      'Option 3'
    );
  });

  it('numbers new options', () => {
    expect(formOptionsField.defaultItemProps(1)).toEqual({
      label: 'Option 2',
      value: 'option-2',
    });
  });

  it('is used by the select and the radio group', () => {
    expect(FormSelectConfig.fields?.options).toBe(formOptionsField);
    expect(FormRadioGroupConfig.fields?.options).toBe(formOptionsField);
  });
});
