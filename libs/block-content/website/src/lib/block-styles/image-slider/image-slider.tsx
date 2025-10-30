import { useKeenSlider } from 'keen-slider/react';
import { allPass } from 'ramda';
import { useState } from 'react';

import { hasBlockStyle } from '../../has-blockstyle';
import { isImageGalleryBlock } from '../../image-gallery/image-gallery-block';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  SliderArrow,
  SliderBall,
  SliderBallContainer,
  SliderBallFill,
  SliderInnerContainer,
  SliderWrapper,
  SlidesContainer,
  useSlidesPadding,
  useSlidesPerView,
} from '../teaser-slider/teaser-slider';
import { BlockContent, ImageGalleryBlock } from '@wepublish/website/api';
import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';

export const ImageSlider = ({
  images,
  slidesPerViewConfig = {},
}: BuilderBlockStyleProps['ImageSlider']) => {
  const {
    blocks: { Image },
  } = useWebsiteBuilder();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const slidesPerView = useSlidesPerView(slidesPerViewConfig);
  const slidePadding = useSlidesPadding();
  const [ref, sliderRef] = useKeenSlider({
    mode: 'free-snap',
    loop: true,
    slides: {
      origin: 'center',
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

  return (
    !!images.length && (
      <SliderWrapper>
        <SliderInnerContainer>
          <SlidesContainer
            ref={ref}
            className="keen-slider"
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="keen-slider__slide"
              >
                <Image
                  caption={image.caption}
                  image={image.image}
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
                  key={idx}
                  onClick={() => sliderRef.current?.moveToIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {currentSlide === idx && <SliderBallFill />}
                </SliderBall>
              ))}

              <SliderArrow
                onClick={() => sliderRef.current?.prev()}
                aria-label="Previous slide"
              >
                <MdArrowBackIos size={22} />
              </SliderArrow>

              <SliderArrow
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

export const isImageSliderBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is ImageGalleryBlock =>
  allPass([hasBlockStyle('Slider'), isImageGalleryBlock])(block);
