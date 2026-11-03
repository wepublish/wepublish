import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { ButtonConfigProps, ButtonRender } from './button.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderButton = (
  props: Partial<ButtonConfigProps> = {},
  extra: Partial<Parameters<typeof ButtonRender>[0]> = {}
) =>
  renderWithProviders(
    createElement(ButtonRender, {
      id: 'Button-1',
      props: { text: 'Read more', variant: 'contained', ...props },
      data: emptyPuckBlockData,
      slots: {},
      className: 'styled-block',
      ...extra,
    })
  );

describe('ButtonRender', () => {
  it('shows the stored text as button label', () => {
    renderButton();

    expect(
      screen.getByRole('button', { name: 'Read more' })
    ).toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderButton();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
    expect(container.firstElementChild).toBe(
      screen.getByRole('button', { name: 'Read more' })
    );
  });

  it('stays flat unless it is elevated', () => {
    renderButton({ elevated: false });

    expect(screen.getByRole('button', { name: 'Read more' })).toHaveClass(
      'MuiButton-disableElevation'
    );
  });

  it('raises elevated buttons', () => {
    renderButton({ elevated: true });

    expect(screen.getByRole('button', { name: 'Read more' })).not.toHaveClass(
      'MuiButton-disableElevation'
    );
  });

  it('hands the button element to the ref the editor passes', () => {
    const ref = vi.fn();

    renderButton({}, { ref });

    expect(ref).toHaveBeenCalledWith(
      screen.getByRole('button', { name: 'Read more' })
    );
  });
});
