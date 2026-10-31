import { PuckContext } from '@puckeditor/core';
import { renderWithProviders } from '@wepublish/mocks/website';
import { fireEvent, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { FormInputRender } from '../form-input/form-input.component';
import { FormProps, FormRender } from './form.component';

const puckContext = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const slot = (children: ReactNode) => () => <div>{children}</div>;

const renderForm = (
  props: Partial<Omit<FormProps, 'content'>> & { isEditing?: boolean } = {},
  children: ReactNode = null
) => {
  const { isEditing = false, ...formProps } = props;

  return renderWithProviders(
    <FormRender
      id="Form-1"
      puck={puckContext(isEditing)}
      action="https://example.us1.list-manage.com/subscribe/post?u=abc&id=def"
      method="post"
      content={slot(children)}
      {...formProps}
    />
  );
};

const getForm = (container: HTMLElement) => {
  const form = container.querySelector('form');

  if (!form) {
    throw new Error('No form rendered');
  }

  return form;
};

const emailInput = (isEditing: boolean) => (
  <FormInputRender
    id="FormInput-1"
    puck={puckContext(isEditing)}
    name="EMAIL"
    label="Email"
    type="email"
  />
);

describe('FormRender', () => {
  it('renders a native form with the configured attributes', () => {
    const { container } = renderForm({
      target: '_blank',
      encType: 'multipart/form-data',
    });
    const form = getForm(container);

    expect(form.getAttribute('action')).toBe(
      'https://example.us1.list-manage.com/subscribe/post?u=abc&id=def'
    );
    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('target')).toBe('_blank');
    expect(form.getAttribute('enctype')).toBe('multipart/form-data');
  });

  it('renders the slot content inside the form', () => {
    const { container } = renderForm({}, emailInput(false));

    expect(
      getForm(container).contains(
        screen.getByRole('textbox', { name: 'Email' })
      )
    ).toBe(true);
  });

  it('leaves out an empty action instead of posting to the current page', () => {
    const { container } = renderForm({ action: '' });

    expect(getForm(container).hasAttribute('action')).toBe(false);
  });

  it('adds a honeypot input that readers and assistive technology skip', () => {
    const { container } = renderForm({ honeypot: 'b_abc_def' });
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="b_abc_def"]'
    );

    expect(honeypot?.type).toBe('text');
    expect(honeypot?.tabIndex).toBe(-1);
    expect(honeypot?.value).toBe('');
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy();
    expect(getForm(container).contains(honeypot)).toBe(true);
  });

  it('renders no honeypot without a name', () => {
    const { container } = renderForm({ honeypot: '' });

    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('prevents submitting in the editor', () => {
    const { container } = renderForm({ isEditing: true });

    expect(fireEvent.submit(getForm(container))).toBe(false);
  });

  it('submits natively on the website', () => {
    const { container } = renderForm({ isEditing: false });

    expect(fireEvent.submit(getForm(container))).toBe(true);
  });

  it('lets the fields inside know they are placed in a form', () => {
    renderForm({ isEditing: true }, emailInput(true));

    expect(screen.queryByText('Place this inside a Form block')).toBeNull();
  });

  it('asks for an action URL in the editor', () => {
    renderForm({ isEditing: true, action: '' });

    expect(
      screen.getByText(
        'Set an action URL so the form knows where to send its data'
      )
    ).toBeTruthy();
  });

  it('does not show editor hints on the website', () => {
    renderForm({ isEditing: false, action: '' });

    expect(
      screen.queryByText(
        'Set an action URL so the form knows where to send its data'
      )
    ).toBeNull();
  });

  it('warns in the editor when a form is nested in another form', () => {
    renderForm(
      { isEditing: true },
      <FormRender
        id="Form-2"
        puck={puckContext(true)}
        action="https://example.com"
        content={slot(null)}
      />
    );

    expect(
      screen.getByText('Forms cannot be placed inside another Form')
    ).toBeTruthy();
  });

  it('never renders a form element inside another form', () => {
    const { container } = renderForm(
      { isEditing: false },
      <FormRender
        id="Form-2"
        puck={puckContext(false)}
        action="https://example.com"
        content={slot(emailInput(false))}
      />
    );

    expect(container.querySelectorAll('form')).toHaveLength(1);
    expect(
      getForm(container).contains(
        screen.getByRole('textbox', { name: 'Email' })
      )
    ).toBe(true);
  });
});
