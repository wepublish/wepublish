import 'keen-slider/keen-slider.min.css';

import { allPass, anyPass } from 'ramda';
import { useEffect, useState } from 'react';

import {
  BlockContent,
  FullTeaserGridBlockFragment,
  FullTeaserListBlockFragment,
  FullTeaserSlotsBlockFragment,
} from '@wepublish/website/api';
import { hasBlockStyle } from '../../has-blockstyle';
import {
  alignmentForTeaserBlock,
  isFilledTeaser,
  isTeaserGridBlock,
} from '../../teaser/teaser-grid-block';
import { isTeaserListBlock } from '../../teaser/teaser-list-block';
import {
  BuilderBlockStyleProps,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';
import { isTeaserSlotsBlock } from '../../teaser/teaser-slots-block';
import {
  useSlidesPerView,
  useSlidesPadding,
  useSlider,
  SliderWrapper,
  SliderTitle,
  SliderInnerContainer,
  SlidesContainer,
  SliderBallContainer,
  SliderBall,
  SliderBallFill,
  SliderArrow,
} from '../slider/slider';

export const TeaserSlider = ({
  blockStyle,
  className,
  teasers,
  slidesPerViewConfig = {},
  dragDisabled = false,
  detailsChanged,
  slideGapConfig = {},
  origin = 'center',
  ...props
}: BuilderBlockStyleProps['TeaserSlider']) => {
  const {
    elements: { H5 },
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const filledTeasers = teasers.filter(isFilledTeaser);

  const [container, setContainer] = useState<HTMLElement | null>(null);

  const slidesPerView = useSlidesPerView(slidesPerViewConfig, container);
  const slidePadding = useSlidesPadding(slideGapConfig, container);

  const sliderRef = useSlider(container, {
    mode: 'free-snap',
    loop: true,
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
    !!filledTeasers.length && (
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
            {filledTeasers.map((teaser, index) => (
              <div
                key={index}
                className="keen-slider__slide"
              >
                <Teaser
                  index={index}
                  teaser={teaser}
                  blockStyle={blockStyle}
                  alignment={alignmentForTeaserBlock(0, 3)}
                />
              </div>
            ))}
          </SlidesContainer>

          {loaded && sliderRef.current && (
            <SliderBallContainer>
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

export const isTeaserSliderBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is
  | FullTeaserGridBlockFragment
  | FullTeaserListBlockFragment
  | FullTeaserSlotsBlockFragment =>
  allPass([
    hasBlockStyle('Slider'),
    anyPass([isTeaserGridBlock, isTeaserListBlock, isTeaserSlotsBlock]),
  ])(block);
