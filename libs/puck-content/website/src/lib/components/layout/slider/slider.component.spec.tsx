import { createTheme, ThemeProvider } from '@mui/material';
import { PuckContext } from '@puckeditor/core';
import { Slider } from '@wepublish/block-content/website';
import { render } from '@testing-library/react';

import { SliderRender } from './slider.component';

vi.mock('@wepublish/block-content/website', () => ({
  Slider: vi.fn(() => null),
}));

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => <div />,
  isEditing,
  dragRef: null,
  metadata: {},
});

const renderSlider = (dragDisabled: boolean | undefined, isEditing = false) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SliderRender
        id="slider"
        puck={puck(isEditing)}
        items={[]}
        settings={{}}
        dragDisabled={dragDisabled}
      />
    </ThemeProvider>
  );

const passedDragDisabled = () =>
  vi.mocked(Slider).mock.calls.at(-1)?.[0].dragDisabled;

describe('SliderRender', () => {
  it('lets readers drag through the slides unless dragging is disabled', () => {
    renderSlider(false);
    expect(passedDragDisabled()).toBe(false);

    renderSlider(undefined);
    expect(passedDragDisabled()).toBe(false);

    renderSlider(true);
    expect(passedDragDisabled()).toBe(true);
  });

  it('never drags the slides in the editor so blocks inside stay draggable', () => {
    renderSlider(false, true);

    expect(passedDragDisabled()).toBe(true);
  });
});
