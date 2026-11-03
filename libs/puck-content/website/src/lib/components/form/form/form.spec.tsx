import { renderWithProviders } from '@wepublish/mocks/website';
import { fireEvent, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { emptyPuckBlockData, PuckSlots } from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { FormInputRender } from '../form-input/form-input.component';
import { FormProps, FormRender } from './form.component';
import { useFormContext } from './form.context';

const contentSlot = (children: ReactNode): PuckSlots => ({
  content: props => <PuckSlot {...props}>{children}</PuckSlot>,
});

const formProps: FormProps = {
  action: 'https://example.us1.list-manage.com/subscribe/post?u=abc&id=def',
  method: 'post',
  content: [],
};

const form = (
  props: Partial<FormProps> = {},
  children: ReactNode = null,
  id = 'Form-1'
) => (
  <FormRender
    id={id}
    props={{ ...formProps, ...props }}
    data={emptyPuckBlockData}
    slots={contentSlot(children)}
    className="styled"
  />
);

const renderForm = (props: Partial<FormProps> = {}, children?: ReactNode) =>
  renderWithProviders(form(props, children));

const getForm = (container: HTMLElement) => {
  const element = container.querySelector('form');

  if (!element) {
    throw new Error('No form rendered');
  }

  return element;
};

const emailInput = (
  <FormInputRender
    id="FormInput-1"
    props={{ name: 'EMAIL', label: 'Email', type: 'email' }}
    data={emptyPuckBlockData}
    slots={{}}
  />
);

const FormProbe = () => {
  const parent = useFormContext();

  return <p>{parent ? `Inside ${parent.id}` : 'Outside a form'}</p>;
};

describe('FormRender', () => {
  it('renders a native form with the configured attributes', () => {
    const { container } = renderForm({
      target: '_blank',
      encType: 'multipart/form-data',
    });
    const element = getForm(container);

    expect(element.getAttribute('action')).toBe(
      'https://example.us1.list-manage.com/subscribe/post?u=abc&id=def'
    );
    expect(element.getAttribute('method')).toBe('post');
    expect(element.getAttribute('target')).toBe('_blank');
    expect(element.getAttribute('enctype')).toBe('multipart/form-data');
  });

  it('renders the form as its single root element with the class name', () => {
    const { container } = renderForm();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(getForm(container));
    expect(getForm(container).classList).toContain('styled');
  });

  it('renders the slot content inside the form', () => {
    const { container } = renderForm({}, emailInput);

    expect(
      getForm(container).contains(
        screen.getByRole('textbox', { name: 'Email' })
      )
    ).toBe(true);
  });

  it('keeps the box of an empty content slot', () => {
    const { container } = renderWithProviders(
      <FormRender
        id="Form-1"
        props={formProps}
        data={emptyPuckBlockData}
        slots={{}}
      />
    );

    expect(getForm(container).children).toHaveLength(1);
  });

  it('tells the blocks inside that they are placed in this form', () => {
    renderForm({}, <FormProbe />);

    expect(screen.getByText('Inside Form-1')).toBeTruthy();
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

  it('submits natively on the website', () => {
    const { container } = renderForm();

    expect(fireEvent.submit(getForm(container))).toBe(true);
  });

  it('hands the submit to the handler the editor passes', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault()
    );
    const { container } = renderWithProviders(
      <FormRender
        id="Form-1"
        props={formProps}
        data={emptyPuckBlockData}
        slots={{}}
        onSubmit={onSubmit}
      />
    );

    expect(fireEvent.submit(getForm(container))).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('never renders a form element inside another form', () => {
    const { container } = renderForm(
      {},
      form({ action: 'https://example.com' }, emailInput, 'Form-2')
    );

    expect(container.querySelectorAll('form')).toHaveLength(1);
    expect(
      getForm(container).contains(
        screen.getByRole('textbox', { name: 'Email' })
      )
    ).toBe(true);
  });

  it('keeps the class name and the content of a nested form on one element', () => {
    const { container } = renderForm(
      {},
      form({ action: 'https://example.com' }, <FormProbe />, 'Form-2')
    );
    const nested = getForm(container).querySelectorAll('.styled');

    expect(nested).toHaveLength(1);
    expect(nested[0].tagName).toBe('DIV');
    expect(nested[0].contains(screen.getByText('Inside Form-2'))).toBe(true);
  });
});
