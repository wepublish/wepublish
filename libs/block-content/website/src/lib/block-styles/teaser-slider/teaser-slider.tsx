import 'keen-slider/keen-slider.min.css'

import {styled, useMediaQuery, useTheme} from '@mui/material'
import {useKeenSlider} from 'keen-slider/react'
import {allPass, anyPass} from 'ramda'
import {useState} from 'react'

import {Block, TeaserGridBlock, TeaserListBlock} from '@wepublish/website/api'
import {hasBlockStyle} from '../../blocks'
import {
  alignmentForTeaserBlock,
  isFilledTeaser,
  isTeaserGridBlock
} from '../../teaser/teaser-grid-block'
import {isTeaserListBlock} from '../../teaser/teaser-list-block'
import {
  BuilderBlockStyleProps,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

export const SliderWrapper = styled('section')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const SliderInnerContainer = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
`

export const SlidesContainer = styled('div')`
  position: relative;
`

export const SliderTitle = styled('div')`
  text-align: center;
`

export const SliderBallContainer = styled('div')`
  display: flex;
  justify-content: center;
  gap: ${({theme}) => theme.spacing(1)};
`

export const SliderBall = styled('button')`
  appearance: none;
  border: none;
  width: ${({theme}) => theme.spacing(2)};
  height: ${({theme}) => theme.spacing(2)};
  background-color: ${({theme}) => theme.palette.grey[200]};
  color: ${({theme}) => theme.palette.primary.main};
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  padding: 0;

  :focus {
    outline: none;
  }
`

export const SliderBallFill = styled('span')`
  display: block;
  background-color: currentColor;
  height: 100%;
`

export const useSlidesPerViewResponsive = () => {
  const theme = useTheme()

  const sm = useMediaQuery(theme.breakpoints.up('sm'), {
    ssrMatchMedia: () => ({matches: false})
  })

  const md = useMediaQuery(theme.breakpoints.up('md'), {
    ssrMatchMedia: () => ({matches: false})
  })

  const lg = useMediaQuery(theme.breakpoints.up('lg'), {
    ssrMatchMedia: () => ({matches: false})
  })

  const xl = useMediaQuery(theme.breakpoints.up('xl'), {
    ssrMatchMedia: () => ({matches: false})
  })

  if (xl) {
    return 2.8
  }

  if (lg) {
    return 2.3
  }

  if (md) {
    return 2.2
  }

  if (sm) {
    return 2
  }

  return 1.4
}

export const useSlidesPadding = () => {
  const theme = useTheme()

  const sm = useMediaQuery(theme.breakpoints.up('sm'), {
    ssrMatchMedia: () => ({matches: false})
  })

  if (sm) {
    return 32
  }

  return 16
}

type TeaserSliderProps = BuilderBlockStyleProps['TeaserSlider'] & {useSlidesPerView: () => number}

export const TeaserSlider = ({
  blockStyle,
  className,
  teasers,
  useSlidesPerView = useSlidesPerViewResponsive,
  ...props
}: TeaserSliderProps) => {
  const {
    elements: {H5},
    blocks: {Teaser}
  } = useWebsiteBuilder()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const filledTeasers = teasers.filter(isFilledTeaser)

  const slidesPerView = useSlidesPerView()
  const slidePadding = useSlidesPadding()
  const [ref, sliderRef] = useKeenSlider({
    mode: 'free-snap',
    loop: true,
    slides: {
      origin: 'center',
      perView: slidesPerView,
      spacing: slidePadding
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel)
    },
    created() {
      setLoaded(true)
    }
  })

  return (
    !!filledTeasers.length && (
      <SliderWrapper className={className}>
        <SliderTitle>
          {(props as BuilderTeaserListBlockProps).title && (
            <H5 component={'h1'}>{(props as BuilderTeaserListBlockProps).title}</H5>
          )}
        </SliderTitle>

        <SliderInnerContainer>
          <SlidesContainer ref={ref} className="keen-slider">
            {filledTeasers.map((teaser, index) => (
              <div key={index} className="keen-slider__slide">
                <Teaser
                  teaser={teaser}
                  blockStyle={blockStyle}
                  alignment={alignmentForTeaserBlock(0, 3)}
                />
              </div>
            ))}
          </SlidesContainer>

          {loaded && sliderRef.current && (
            <SliderBallContainer>
              {[...Array(sliderRef.current?.track.details?.slides.length).keys()].map(idx => (
                <SliderBall
                  key={idx}
                  onClick={() => sliderRef.current?.moveToIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}>
                  {currentSlide === idx && <SliderBallFill />}
                </SliderBall>
              ))}
            </SliderBallContainer>
          )}
        </SliderInnerContainer>
      </SliderWrapper>
    )
  )
}

export const isTeaserSliderBlockStyle = (
  block: Block
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('Slider'), anyPass([isTeaserGridBlock, isTeaserListBlock])])(block)
