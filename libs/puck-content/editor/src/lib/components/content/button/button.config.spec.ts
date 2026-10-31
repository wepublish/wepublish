import { PuckContext } from '@puckeditor/core';
import { render } from '@testing-library/react';
import { ButtonRender } from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { ButtonConfig } from './button.config';

vi.mock('@wepublish/puck-content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/puck-content/website')>()),
  ButtonRender: vi.fn(() => null),
}));

const dragRef = vi.fn();

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef,
  metadata: {},
});

const renderButton = (isEditing: boolean) =>
  render(
    createElement(ButtonConfig.render, {
      ...ButtonConfig.defaultProps,
      id: 'Button-1',
      puck: puck(isEditing),
    } as Parameters<typeof ButtonConfig.render>[0])
  );

const lastButtonProps = () => vi.mocked(ButtonRender).mock.calls.at(-1)?.[0];

describe('ButtonConfig', () => {
  it('is dragged by the button itself', () => {
    expect(ButtonConfig.inline).toBe(true);
  });

  it('renders the website button with the stored props', () => {
    renderButton(true);

    expect(lastButtonProps()).toMatchObject({
      id: 'Button-1',
      props: { text: 'Hello, world', variant: 'contained', elevated: true },
    });
  });

  it('hands the drag handle of Puck to the button as ref', () => {
    renderButton(true);

    expect(lastButtonProps()?.ref).toBe(dragRef);
  });
});
