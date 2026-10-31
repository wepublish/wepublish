import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { FormContext } from '@wepublish/puck-content/website';
import { createElement, ReactElement } from 'react';

import { MailchimpFormConfig } from './mailchimp-form.config';

const puckContext = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const mailchimpForm = (isEditing: boolean) =>
  createElement(MailchimpFormConfig.render, {
    ...MailchimpFormConfig.defaultProps,
    id: 'MailchimpForm-1',
    puck: puckContext(isEditing),
    syncProviderId: 'mailchimp',
    listId: 'audience',
  } as Parameters<typeof MailchimpFormConfig.render>[0]);

const insideForm = (ui: ReactElement) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-1' }}>{ui}</FormContext.Provider>
  );

const nestedFormWarning =
  'This block has its own form and cannot be placed inside a Form';

describe('MailchimpFormConfig render', () => {
  it('warns in the editor instead of nesting its form inside a Form', () => {
    const { container } = insideForm(mailchimpForm(true));

    expect(screen.getByText(nestedFormWarning)).toBeTruthy();
    expect(container.querySelector('form')).toBeNull();
  });

  it('renders its own form without a warning outside a Form', () => {
    const { container } = renderWithProviders(mailchimpForm(true));

    expect(container.querySelectorAll('form')).toHaveLength(1);
    expect(screen.queryByText(nestedFormWarning)).toBeNull();
  });

  it('renders nothing inside a Form outside the editor', () => {
    const { container } = insideForm(mailchimpForm(false));

    expect(container.textContent).toBe('');
  });
});
