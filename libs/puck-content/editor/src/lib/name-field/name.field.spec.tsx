import { CustomField } from '@puckeditor/core';
import { fireEvent, render, screen } from '@testing-library/react';

import { nameField } from './name.field';

const renderField = (value: string, onChange = vi.fn()) => {
  const field = nameField('Template name') as CustomField<string>;

  render(
    <>
      {field.render({
        field,
        name: 'templateName',
        id: 'templateName',
        value,
        onChange,
        readOnly: false,
      } as never)}
    </>
  );

  return onChange;
};

describe('nameField', () => {
  it('edits the name as text', () => {
    const onChange = renderField('Rubric');

    const input = screen.getByRole('textbox', { name: 'Template name' });

    expect(input).toHaveValue('Rubric');

    fireEvent.change(input, { target: { value: 'Header' } });

    expect(onChange).toHaveBeenCalledWith('Header');
  });

  it('keeps password managers from filling it in', () => {
    renderField('');

    const input = screen.getByRole('textbox', { name: 'Template name' });

    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('data-1p-ignore');
    expect(input).toHaveAttribute('data-lpignore', 'true');
    expect(input).toHaveAttribute('data-bwignore');
  });
});
