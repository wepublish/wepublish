import { PuckContext } from '@puckeditor/core';
import { render } from '@testing-library/react';
import { SliderRender } from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { Slider } from './slider.config';

vi.mock('@wepublish/puck-content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/puck-content/website')>()),
  SliderRender: vi.fn(() => null),
}));

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const renderSlider = (isEditing: boolean, dragDisabled?: boolean) =>
  render(
    createElement(Slider.render, {
      id: 'Slider-1',
      puck: puck(isEditing),
      items: [],
      settings: {},
      dragDisabled,
    })
  );

const lastRenderProps = () => vi.mocked(SliderRender).mock.calls.at(-1)?.[0];

describe('Slider', () => {
  it('lets editors reach the slider controls through the overlay', () => {
    renderSlider(true);

    expect(lastRenderProps()).toMatchObject({
      refs: { control: expect.any(Function) },
    });
  });

  it('never drags the slides in the editor so blocks inside stay draggable', () => {
    renderSlider(true, false);

    expect(lastRenderProps()?.props.dragDisabled).toBe(true);
  });

  it('drags the slides in the preview unless dragging is disabled', () => {
    renderSlider(false, false);
    expect(lastRenderProps()?.props.dragDisabled).toBe(false);

    renderSlider(false, true);
    expect(lastRenderProps()?.props.dragDisabled).toBe(true);
  });
});
