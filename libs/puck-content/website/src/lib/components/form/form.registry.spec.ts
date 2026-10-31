import { MailchimpFormRender } from '../data/mailchimp-form/mailchimp-form.component';
import { SubscribeRender } from '../subscribe/subscribe.component';
import { FormCheckboxRender } from './form-checkbox/form-checkbox.component';
import { FormHiddenRender } from './form-hidden/form-hidden.component';
import { FormInputRender } from './form-input/form-input.component';
import { FormRadioGroupRender } from './form-radio-group/form-radio-group.component';
import { FormSelectRender } from './form-select/form-select.component';
import { FormSubmitRender } from './form-submit/form-submit.component';
import { FormTextareaRender } from './form-textarea/form-textarea.component';
import { FormBlockProps, formBlockRegistry } from './form.registry';
import { FormRender } from './form/form.component';

describe('formBlockRegistry', () => {
  it('renders every form block type with its website component', () => {
    expect(formBlockRegistry).toEqual({
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
    });
  });

  it('names the props of the ten form block types', () => {
    expectTypeOf<keyof FormBlockProps>().toEqualTypeOf<
      | 'Subscribe'
      | 'MailchimpForm'
      | 'Form'
      | 'FormInput'
      | 'FormTextarea'
      | 'FormCheckbox'
      | 'FormSelect'
      | 'FormRadioGroup'
      | 'FormHidden'
      | 'FormSubmit'
    >();
  });

  it('stores the Form content as an emptied slot', () => {
    expectTypeOf<FormBlockProps['Form']['content']>().toEqualTypeOf<[]>();
  });

  it('keeps the class name and the envelope out of the stored props', () => {
    type WithEnvelopeKey = {
      [Type in keyof FormBlockProps]: Extract<
        keyof FormBlockProps[Type],
        'className' | 'datasources' | 'id' | 'puck'
      > extends never ?
        never
      : Type;
    }[keyof FormBlockProps];

    expectTypeOf<WithEnvelopeKey>().toEqualTypeOf<never>();
  });
});
