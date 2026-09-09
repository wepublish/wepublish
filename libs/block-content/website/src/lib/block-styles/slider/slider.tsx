import 'keen-slider/keen-slider.min.css';

import { Breakpoint, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import KeenSlider, {
  KeenSliderHooks,
  KeenSliderInstance,
  KeenSliderOptions,
  KeenSliderPlugin,
} from 'keen-slider';
import {
  Children,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  BuilderSliderConfig,
  BuilderSlideGap,
  BuilderSlidesPerView,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';

export const SliderWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const SliderInnerContainer = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
`;

export const SlidesContainer = styled('div')`
  position: relative;
`;

export const SliderTitle = styled('div')`
  text-align: center;
`;

export const SliderBallContainer = styled('div')`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  position: relative;
`;

export const SliderBall = styled('button')`
  appearance: none;
  border: none;
  width: ${({ theme }) => theme.spacing(2)};
  height: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.grey[200]};
  color: ${({ theme }) => theme.palette.primary.main};
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  padding: 0;

  :focus {
    outline: none;
  }
`;

export const SliderBallFill = styled('span')`
  display: block;
  background-color: currentColor;
  height: 100%;
`;

export const SliderArrow = styled('button')`
  appearance: none;
  border: none;
  background: transparent;
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 2;
  cursor: pointer;
  display: none;

  &:last-of-type {
    right: 0;
    left: initial;
  }

  &:hover {
    color: #000;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

/**
 * Resolves the active theme breakpoint against the window that owns the given
 * element rather than the global window. The Puck editor renders the preview
 * inside an iframe, so the global window would report the editor's viewport
 * instead of the preview's.
 */
export const useSliderBreakpoint = (element: Element | null): Breakpoint => {
  const theme = useTheme();
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    const view =
      element?.ownerDocument.defaultView ??
      (typeof window !== 'undefined' ? window : undefined);

    if (!view?.matchMedia) {
      return;
    }

    const queries = theme.breakpoints.keys.map(
      key =>
        [
          key,
          view.matchMedia(theme.breakpoints.up(key).replace(/^@media\s*/, '')),
        ] as const
    );

    const update = () => {
      const active = queries.filter(([, query]) => query.matches).at(-1);
      setBreakpoint(active?.[0] ?? theme.breakpoints.keys[0]);
    };

    update();

    for (const [, query] of queries) {
      query.addEventListener('change', update);
    }

    return () => {
      for (const [, query] of queries) {
        query.removeEventListener('change', update);
      }
    };
  }, [element, theme]);

  return breakpoint;
};

export const useSlidesPerView = (
  { xs = 1.4, sm = 2, md = 2.2, lg = 2.3, xl = 2.8 }: BuilderSlidesPerView = {},
  element: Element | null = null
) => {
  const breakpoint = useSliderBreakpoint(element);

  return { xs, sm, md, lg, xl }[breakpoint];
};

export const useSlidesPadding = (
  { xs = 16, sm = 32, md = sm, lg = md, xl = lg }: BuilderSlideGap = {},
  element: Element | null = null
) => {
  const breakpoint = useSliderBreakpoint(element);

  return { xs, sm, md, lg, xl }[breakpoint];
};

export const useSlider = <O, P, H extends string = KeenSliderHooks>(
  container: HTMLElement | null,
  options: KeenSliderOptions<O, P, H>,
  plugins?: KeenSliderPlugin<O, P, H>[]
) => {
  const sliderRef = useRef<KeenSliderInstance<O, P, H> | null>(null);
  const optionsRef = useRef(options);
  const pluginsRef = useRef(plugins);

  optionsRef.current = options;
  pluginsRef.current = plugins;

  useEffect(() => {
    if (!container) {
      return;
    }

    const slider = new KeenSlider<O, P, H>(
      () => [container],
      optionsRef.current,
      pluginsRef.current
    );

    if (typeof slider.update !== 'function') {
      return;
    }

    sliderRef.current = slider;

    const observer =
      typeof ResizeObserver !== 'undefined' ?
        new ResizeObserver(() => slider.update())
      : undefined;
    observer?.observe(container);

    return () => {
      observer?.disconnect();
      slider.destroy();
      sliderRef.current = null;
    };
  }, [container]);

  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    sliderRef.current?.update(optionsRef.current);
  }, [optionsKey]);

  return sliderRef;
};

export const Slider = ({
  className,
  children,
  slidesPerViewConfig = {},
  dragDisabled = false,
  detailsChanged,
  slideGapConfig = {},
  origin = 'center',
  refs,
  loop = true,
  ...props
}: PropsWithChildren<BuilderSliderConfig>) => {
  const {
    elements: { H5 },
  } = useWebsiteBuilder();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const slides = Children.toArray(children);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const slidesPerView = useSlidesPerView(slidesPerViewConfig, container);
  const slidePadding = useSlidesPadding(slideGapConfig, container);

  const sliderRef = useSlider(container, {
    mode: 'free-snap',
    loop,
    drag: dragDisabled ? false : true,
    detailsChanged: detailsChanged ? detailsChanged : void 0,
    slides: {
      origin,
      perView: slidesPerView,
      spacing: slidePadding,
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => sliderRef.current?.update?.());
    return () => cancelAnimationFrame(frame);
  }, [sliderRef]);

  return (
    !!slides.length && (
      <SliderWrapper className={className}>
        {(props as BuilderTeaserListBlockProps).title && (
          <SliderTitle>
            <H5 component={'h1'}>
              {(props as BuilderTeaserListBlockProps).title}
            </H5>
          </SliderTitle>
        )}

        <SliderInnerContainer>
          <SlidesContainer
            ref={setContainer}
            className="keen-slider"
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className="keen-slider__slide"
              >
                {slide}
              </div>
            ))}
          </SlidesContainer>

          {loaded && sliderRef.current && (
            <SliderBallContainer ref={refs?.control}>
              {[
                ...Array(
                  sliderRef.current?.track.details?.slides.length
                ).keys(),
              ].map(idx => (
                <SliderBall
                  type="button"
                  key={idx}
                  onClick={() => sliderRef.current?.moveToIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {currentSlide === idx && <SliderBallFill />}
                </SliderBall>
              ))}

              <SliderArrow
                type="button"
                onClick={() => sliderRef.current?.prev()}
                aria-label="Previous slide"
              >
                <MdArrowBackIos size={22} />
              </SliderArrow>

              <SliderArrow
                type="button"
                onClick={() => sliderRef.current?.next()}
                aria-label="Next slide"
              >
                <MdArrowForwardIos size={22} />
              </SliderArrow>
            </SliderBallContainer>
          )}
        </SliderInnerContainer>
      </SliderWrapper>
    )
  );
};
