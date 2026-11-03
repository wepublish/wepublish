import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { Slider } from '@wepublish/block-content/website';
import { PropsWithChildren } from 'react';

import {
  emptyPuckBlockData,
  PuckSlotComponent,
  PuckSlots,
} from '../../../blocks/block.types';
import { PuckSlot } from '../../../blocks/slots.component';
import { SliderRender } from './slider.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

vi.mock('@wepublish/block-content/website', () => ({
  Slider: vi.fn(({ children }: PropsWithChildren) => (
    <div data-testid="slider">{children}</div>
  )),
}));

const slotWith =
  (text: string): PuckSlotComponent =>
  props => (
    <PuckSlot {...props}>
      <p>{text}</p>
    </PuckSlot>
  );

const renderSlider = (
  dragDisabled: boolean | undefined,
  extra: Partial<Parameters<typeof SliderRender>[0]> = {},
  slots: PuckSlots = {}
) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SliderRender
        id="Slider-1"
        props={{
          items: [{ content: [] }, { content: [] }],
          settings: { xs: { perView: 1.5, gap: 8 } },
          dragDisabled,
        }}
        data={emptyPuckBlockData}
        slots={slots}
        className="styled"
        {...extra}
      />
    </ThemeProvider>
  );

const lastSliderProps = () => vi.mocked(Slider).mock.calls.at(-1)?.[0];

describe('SliderRender', () => {
  it('lets readers drag through the slides unless dragging is disabled', () => {
    renderSlider(false);
    expect(lastSliderProps()?.dragDisabled).toBe(false);

    renderSlider(undefined);
    expect(lastSliderProps()?.dragDisabled).toBe(false);

    renderSlider(true);
    expect(lastSliderProps()?.dragDisabled).toBe(true);
  });

  it('hands the class name and the stored settings to the slider', () => {
    renderSlider(false);

    expect(lastSliderProps()).toMatchObject({
      className: 'styled',
      slidesPerViewConfig: { xs: 1.5 },
      slideGapConfig: { xs: 8 },
    });
  });

  it('renders a slide per item from the slot of the item', () => {
    renderSlider(false, {}, { 'items[1].content': slotWith('Second slide') });

    const slides = [...screen.getByTestId('slider').children];

    expect(slides).toHaveLength(2);
    expect(slides[0]?.childElementCount).toBe(0);
    expect(slides[1]).toBe(screen.getByText('Second slide').parentElement);
  });

  it('hands the control ref it receives to the slider', () => {
    const control = vi.fn();

    renderSlider(false, { refs: { control } });

    expect(lastSliderProps()?.refs).toEqual({ control });
  });
});
