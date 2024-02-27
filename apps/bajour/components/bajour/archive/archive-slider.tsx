import 'keen-slider/keen-slider.min.css'

import {css, styled} from '@mui/material'
import {ApiV1, selectTeaserImage, useWebsiteBuilder} from '@wepublish/website'
import {useKeenSlider} from 'keen-slider/react'
import {useState} from 'react'

import {ArchiveProps} from './archive'

type ArchiveSliderProps = {
  teasers: ArchiveProps['teasers']
  setTeaser: (teaser: ApiV1.ArticleTeaser | ApiV1.PeerArticleTeaser) => void
}

export const SliderContainerBig = styled('div')`
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

const SliderContainer = styled('div')`
  width: 100%;
  max-width: 100vw;
  overflow: hidden;

  .keen-slider {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    height: 100%;
    max-width: 100%;
    width: 100%;
  }

  .keen-slider__slide {
    transform: none !important; // enforce
    min-width: 0 !important; // enforce
    max-width: 60% !important; // enforce
    width: auto;
  }
`

const Slide = styled('div')<{current: boolean}>`
  position: relative;
  cursor: pointer;
  transition: flex-basis 0.3s ease-in-out, margin 0.3s ease-in-out !important;
  height: ${({theme}) => theme.spacing(25)};
  flex-basis: 10%;

  ${({theme, current}) =>
    current &&
    css`
      flex-basis: 50%;
      margin: 0 ${theme.spacing(1)};

      ${theme.breakpoints.up('sm')} {
        margin: 0 ${theme.spacing(2)};
      }

      ${theme.breakpoints.up('lg')} {
        margin: 0 ${theme.spacing(3)};
      }
    `}

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      height: ${theme.spacing(40)};
    }
  `}

  ${({theme}) => css`
    ${theme.breakpoints.up('lg')} {
      height: ${theme.spacing(50)};
    }
  `}
`

const ArchiveDate = styled('div')`
  position: absolute;
  background: white;
  height: 80%;
  bottom: 0;
  width: ${({theme}) => theme.spacing(2)};
  right: ${({theme}) => theme.spacing(1)};
  writing-mode: vertical-rl;
  transform: rotateZ(-180deg);
  font-size: 8px;
  color: ${({theme}) => theme.palette.secondary.main};
  text-transform: uppercase;
  font-weight: bold;
  padding-top: ${({theme}) => theme.spacing(1.5)};
  padding-right: ${({theme}) => theme.spacing(0.5)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      font-size: 14px;
      width: ${theme.spacing(4)};
      right: ${theme.spacing(1.5)};
    }
  `}

  ${({theme}) => css`
    ${theme.breakpoints.up('lg')} {
      font-size: 21px;
      width: ${theme.spacing(6)};
      right: ${theme.spacing(2)};
    }
  `}
`

const imageStyles = css`
  height: 100%;
  width: 100%;
  object-fit: cover;
`

const getDate = (date: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('de-DE', options)
}

export const ArchiveSlider = ({teasers, setTeaser}: ArchiveSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(2)

  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const [sliderRef] = useKeenSlider({
    initial: currentSlide,
    mode: 'free-snap',
    loop: false,
    slides: {
      origin: 'center',
      perView: 6
    }
  })

  const changeSlide = (index: number) => {
    setCurrentSlide(index)
    setTeaser(teasers[index])
  }

  return (
    <SliderContainer>
      <SliderInnerContainer ref={sliderRef} className="keen-slider">
        {teasers.map((teaser, index) => {
          const img = selectTeaserImage(teaser)
          return (
            <Slide
              key={index}
              className="keen-slider__slide"
              current={index === currentSlide}
              onClick={() => changeSlide(index)}>
              {img && <Image image={img} css={imageStyles} />}
              {teaser.article?.publishedAt && (
                <ArchiveDate>{getDate(teaser.article?.publishedAt)}</ArchiveDate>
              )}
            </Slide>
          )
        })}
      </SliderInnerContainer>
    </SliderContainer>
  )
}
