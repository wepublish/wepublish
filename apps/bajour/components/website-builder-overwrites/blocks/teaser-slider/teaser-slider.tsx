import 'keen-slider/keen-slider.min.css'

import {css, styled, useMediaQuery, useTheme} from '@mui/material'
import {
  ApiV1,
  BuilderTeaserGridBlockProps,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserGridBlock
} from '@wepublish/website'
import {useKeenSlider} from 'keen-slider/react'
import {allPass} from 'ramda'
import {useState} from 'react'

import {TeaserSlide} from './teaser-slide'

export const isTeaserSlider = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasBlockStyle('Slider'), isTeaserGridBlock])(block)

export const SliderContainer = styled('div')`
  display: grid;
  position: relative;
  padding-top: ${({theme}) => theme.spacing(2)};
  padding-bottom: ${({theme}) => theme.spacing(2)};
  gap: ${({theme}) => theme.spacing(5)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    padding-top: ${({theme}) => theme.spacing(3)};
    padding-bottom: ${({theme}) => theme.spacing(3)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-top: ${({theme}) => theme.spacing(5)};
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    padding-top: ${({theme}) => theme.spacing(7)};
  }
`

const SliderInnerContainer = styled('div')``

const SliderInnerBackground = styled('div')`
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: #feede8;

  ${({theme}) => theme.breakpoints.up('sm')} {
    left: calc(100% / 12);
    right: calc(100% / 12);
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    left: calc((100% / 12) * 2);
    right: calc((100% / 12) * 2);
  }
`

const BallContainer = styled('div')`
  display: flex;
  justify-content: center;
  gap: ${({theme}) => theme.spacing(1)};
`

const Ball = styled('button', {
  shouldForwardProp: prop => prop !== 'isActive'
})<{isActive: boolean}>`
  appearance: none;
  border: none;
  width: ${({theme}) => theme.spacing(2)};
  height: ${({theme}) => theme.spacing(2)};
  background: ${({theme}) => theme.palette.common.white};
  border-radius: 50%;
  cursor: pointer;

  :focus {
    outline: none;
  }

  ${({theme, isActive}) =>
    isActive &&
    css`
      background: ${theme.palette.error.main};
    `}
`

const useSlidesPerView = () => {
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

const useSlidesPadding = () => {
  const theme = useTheme()

  const sm = useMediaQuery(theme.breakpoints.up('sm'), {
    ssrMatchMedia: () => ({matches: false})
  })

  if (sm) {
    return 32
  }

  return 16
}

export const TeaserSlider = ({teasers}: BuilderTeaserGridBlockProps) => {
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
    <SliderContainer>
      <SliderInnerBackground />

      <SliderInnerContainer ref={ref} className="keen-slider">
        {filledTeasers.map((teaser, index) => (
          <div key={index} className="keen-slider__slide">
            {<TeaserSlide teaser={teaser} />}
          </div>
        ))}
      </SliderInnerContainer>

      {loaded && sliderRef.current && (
        <BallContainer>
          {[...Array(sliderRef.current?.track.details.slides.length).keys()].map(idx => (
            <Ball
              key={idx}
              onClick={() => sliderRef.current?.moveToIdx(idx)}
              isActive={currentSlide === idx}
            />
          ))}
        </BallContainer>
      )}
    </SliderContainer>
  )
}
