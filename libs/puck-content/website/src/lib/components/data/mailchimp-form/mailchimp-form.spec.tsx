import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { MailchimpFormOptionsLayout } from '@wepublish/website/api';
import { ReactElement } from 'react';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { FormContext } from '../../form/form/form.context';
import {
  MailchimpFormConfigProps,
  MailchimpFormRender,
} from './mailchimp-form.component';

const emailStep = {
  skipIfFieldsFilled: [],
  skipIfInterestsFilled: [],
  showIfInterestsFilled: [],
  inputs: [
    {
      inputType: 'email',
      name: 'EMAIL',
      label: 'Email',
      description: '',
      required: false,
      urlParam: '',
      defaultValue: '',
      value: '',
      optionsLayout: MailchimpFormOptionsLayout.List,
      options: [],
    },
  ],
};

const mailchimpProps: MailchimpFormConfigProps = {
  interests: [],
  autoFocus: false,
  doubleOptIn: false,
  submitButtonLabel: 'Subscribe',
  steps: [emailStep],
  syncProviderId: 'mailchimp',
  listId: 'audience',
};

const mailchimpForm = (
  <MailchimpFormRender
    id="MailchimpForm-1"
    props={mailchimpProps}
    data={emptyPuckBlockData}
    slots={{}}
    className="styled"
  />
);

const insideForm = (ui: ReactElement) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-1' }}>{ui}</FormContext.Provider>
  );

describe('MailchimpFormRender', () => {
  it('renders its own sign-up form', () => {
    const { container } = renderWithProviders(mailchimpForm);

    expect(container.querySelectorAll('form')).toHaveLength(1);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders one root element that carries the class name', () => {
    const { container } = renderWithProviders(mailchimpForm);

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.classList).toContain('styled');
  });

  it('renders nothing inside a Form', () => {
    const { container } = insideForm(mailchimpForm);

    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toBe('');
  });
});
