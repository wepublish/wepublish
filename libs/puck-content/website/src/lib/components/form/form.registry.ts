import { PuckBlockDefinition } from '../../blocks/block.types';
import {
  MailchimpFormConfigProps,
  MailchimpFormRender,
} from '../data/mailchimp-form/mailchimp-form.component';
import {
  SubscribeConfigProps,
  SubscribeRender,
} from '../subscribe/subscribe.component';
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
import { FormExtra, FormProps, FormRender } from './form/form.component';

export type FormBlockProps = {
  Subscribe: SubscribeConfigProps;
  MailchimpForm: MailchimpFormConfigProps;
  Form: FormProps;
  FormInput: FormInputProps;
  FormTextarea: FormTextareaProps;
  FormCheckbox: FormCheckboxProps;
  FormSelect: FormSelectProps;
  FormRadioGroup: FormRadioGroupProps;
  FormHidden: FormHiddenProps;
  FormSubmit: FormSubmitProps;
};

type FormBlockExtra = {
  Form: FormExtra;
};

export const formBlockRegistry: {
  [Type in keyof FormBlockProps]: PuckBlockDefinition<
    FormBlockProps[Type],
    Type extends keyof FormBlockExtra ? FormBlockExtra[Type] : object
  >;
} = {
  Subscribe: { component: SubscribeRender },
  MailchimpForm: { component: MailchimpFormRender },
  Form: { component: FormRender },
  FormInput: { component: FormInputRender },
  FormTextarea: { component: FormTextareaRender },
  FormCheckbox: { component: FormCheckboxRender },
  FormSelect: { component: FormSelectRender },
  FormRadioGroup: { component: FormRadioGroupRender },
  FormHidden: { component: FormHiddenRender },
  FormSubmit: { component: FormSubmitRender },
};

export * from '../data/mailchimp-form/mailchimp-form.component';
export * from '../subscribe/subscribe.component';
export * from './form-checkbox/form-checkbox.component';
export * from './form-field.component';
export * from './form-field.styles';
export * from './form-hidden/form-hidden.component';
export * from './form-input/form-input.component';
export * from './form-option';
export * from './form-radio-group/form-radio-group.component';
export * from './form-select/form-select.component';
export * from './form-submit/form-submit.component';
export * from './form-textarea/form-textarea.component';
export * from './form/form.component';
export * from './form/form.context';
export * from './form/form.styles';
export * from './outside-form-only.component';
