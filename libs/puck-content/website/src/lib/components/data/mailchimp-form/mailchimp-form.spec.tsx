import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement, ReactElement } from 'react';

import { FormContext } from '../../form/form/form.context';
import { MailchimpFormRender } from './mailchimp-form.component';
import { MailchimpFormConfig } from './mailchimp-form.config';

const puckContext = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const mailchimpForm = (isEditing: boolean) =>
  createElement(MailchimpFormRender, {
    ...MailchimpFormConfig.defaultProps,
    id: 'MailchimpForm-1',
    puck: puckContext(isEditing),
    syncProviderId: 'mailchimp',
    listId: 'audience',
  } as Parameters<typeof MailchimpFormRender>[0]);

const insideForm = (ui: ReactElement) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-1' }}>{ui}</FormContext.Provider>
  );

const nestedFormWarning =
  'This block has its own form and cannot be placed inside a Form';

describe('MailchimpFormRender', () => {
  it('renders its own sign-up form', () => {
    const { container } = renderWithProviders(mailchimpForm(false));

    expect(container.querySelectorAll('form')).toHaveLength(1);
    expect(screen.queryByText(nestedFormWarning)).toBeNull();
  });

  it('warns in the editor instead of nesting its form inside a Form', () => {
    const { container } = insideForm(mailchimpForm(true));

    expect(screen.getByText(nestedFormWarning)).toBeTruthy();
    expect(container.querySelector('form')).toBeNull();
  });

  it('renders nothing inside a Form on the website', () => {
    const { container } = insideForm(mailchimpForm(false));

    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toBe('');
  });
});
