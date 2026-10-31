import { PuckContext, SlotComponent } from '@puckeditor/core';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { FormContext } from '@wepublish/puck-content/website';
import { createElement, ReactElement, ReactNode } from 'react';

import { FormInputConfig } from '../form-input/form-input.config';
import { FormConfig } from './form.config';

const puckContext = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const contentSlot = (children: ReactNode) =>
  vi.fn<SlotComponent>(props => (
    <div
      data-min-empty-height={props?.minEmptyHeight}
      className={props?.className}
    >
      {children}
    </div>
  ));

const form = (
  isEditing: boolean,
  {
    action = 'https://example.com/subscribe',
    children = null as ReactNode,
  } = {}
) =>
  createElement(FormConfig.render, {
    id: 'Form-1',
    puck: puckContext(isEditing),
    action,
    method: 'post',
    content: contentSlot(children),
  });

const emailInput = (isEditing: boolean) =>
  createElement(FormInputConfig.render, {
    id: 'FormInput-1',
    puck: puckContext(isEditing),
    name: 'EMAIL',
    label: 'Email',
    type: 'email',
  });

const insideForm = (ui: ReactElement) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-0' }}>{ui}</FormContext.Provider>
  );

const getForm = (container: HTMLElement) => {
  const element = container.querySelector('form');

  if (!element) {
    throw new Error('No form rendered');
  }

  return element;
};

const missingAction =
  'Set an action URL so the form knows where to send its data';
const nestedForm = 'Forms cannot be placed inside another Form';

describe('FormConfig render', () => {
  it('prevents submitting in the editor', () => {
    const { container } = renderWithProviders(form(true));

    expect(fireEvent.submit(getForm(container))).toBe(false);
  });

  it('submits natively outside the editor', () => {
    const { container } = renderWithProviders(form(false));

    expect(fireEvent.submit(getForm(container))).toBe(true);
  });

  it('keeps an empty content slot droppable', () => {
    renderWithProviders(form(true));

    expect(
      document
        .querySelector('[data-min-empty-height]')
        ?.getAttribute('data-min-empty-height')
    ).toBe('120');
  });

  it('asks for an action URL in the editor, above the form', () => {
    const { container } = renderWithProviders(form(true, { action: '' }));
    const hint = screen.getByText(missingAction);

    expect(
      hint.compareDocumentPosition(getForm(container)) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows no hint for a form with an action', () => {
    renderWithProviders(form(true));

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not show editor hints outside the editor', () => {
    renderWithProviders(form(false, { action: '' }));

    expect(screen.queryByText(missingAction)).toBeNull();
  });

  it('warns in the editor when a form is nested in another form', () => {
    insideForm(form(true));

    expect(screen.getByText(nestedForm)).toBeTruthy();
  });

  it('lets the fields inside know they are placed in a form', () => {
    renderWithProviders(form(true, { children: emailInput(true) }));

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
    expect(screen.queryByText('Place this inside a Form block')).toBeNull();
  });
});
