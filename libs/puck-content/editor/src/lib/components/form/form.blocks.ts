import { withCSS } from '../../blocks/with-css';
import { withVisibility } from '../../blocks/with-visibility';
import { MailchimpFormConfig } from '../data/mailchimp-form/mailchimp-form.config';
import { SubscribeConfig } from '../subscribe/subscribe.config';
import { FormCheckboxConfig } from './form-checkbox/form-checkbox.config';
import { FormHiddenConfig } from './form-hidden/form-hidden.config';
import { FormInputConfig } from './form-input/form-input.config';
import { FormRadioGroupConfig } from './form-radio-group/form-radio-group.config';
import { FormSelectConfig } from './form-select/form-select.config';
import { FormSubmitConfig } from './form-submit/form-submit.config';
import { FormTextareaConfig } from './form-textarea/form-textarea.config';
import { FormConfig } from './form/form.config';

export const formComponents = {
  Subscribe: withVisibility(withCSS(SubscribeConfig)),
  MailchimpForm: withVisibility(withCSS(MailchimpFormConfig)),
  Form: withVisibility(withCSS(FormConfig)),
  FormInput: withVisibility(withCSS(FormInputConfig)),
  FormTextarea: withVisibility(withCSS(FormTextareaConfig)),
  FormCheckbox: withVisibility(withCSS(FormCheckboxConfig)),
  FormSelect: withVisibility(withCSS(FormSelectConfig)),
  FormRadioGroup: withVisibility(withCSS(FormRadioGroupConfig)),
  FormHidden: withVisibility(FormHiddenConfig),
  FormSubmit: withVisibility(withCSS(FormSubmitConfig)),
};

export * from '../data/mailchimp-form/mailchimp-form.config';
export * from '../subscribe/subscribe.config';
export * from './form-checkbox/form-checkbox.config';
export * from './form-components';
export * from './form-field-fields';
export * from './form-hidden/form-hidden.config';
export * from './form-input/form-input.config';
export * from './form-options.field';
export * from './form-radio-group/form-radio-group.config';
export * from './form-select/form-select.config';
export * from './form-submit/form-submit.config';
export * from './form-textarea/form-textarea.config';
export * from './form/form.config';
