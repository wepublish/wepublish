import 'keen-slider/keen-slider.min.css';

import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  selectTeaserDate,
  selectTeaserImage,
} from '@wepublish/block-content/website';
import { Teaser } from '@wepublish/website/api';
import {
  BuilderTeaserGridBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useKeenSlider } from 'keen-slider/react';
import { DOMAttributes, useState } from 'react';

type ArchiveSliderProps = {
  teasers: BuilderTeaserGridBlockProps['teasers'];
  setTeaser: (teaser: Teaser) => void;
};

const SliderWrapper = styled('div')`
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
`;

const Slide = styled('div')<{ isCurrent?: boolean }>`
  position: relative;
  cursor: pointer;
  transition:
    flex-basis 0.3s ease-in-out,
    margin 0.3s ease-in-out;
  height: ${({ theme }) => theme.spacing(25)};
  flex-basis: 10%;

  ${({ theme, isCurrent }) =>
    isCurrent &&
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

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      height: ${theme.spacing(40)};
    }
  `}

  ${({ theme }) => css`
    ${theme.breakpoints.up('lg')} {
      height: ${theme.spacing(50)};
    }
  `}
`;

const ArchiveDate = styled('div')`
  position: absolute;
  background: white;
  height: 80%;
  bottom: 0;
  width: ${({ theme }) => theme.spacing(2)};
  right: ${({ theme }) => theme.spacing(1)};
  writing-mode: vertical-rl;
  transform: rotateZ(-180deg);
  font-size: 8px;
  color: ${({ theme }) => theme.palette.error.main};
  text-transform: uppercase;
  font-weight: bold;
  padding-top: ${({ theme }) => theme.spacing(1.5)};
  padding-right: ${({ theme }) => theme.spacing(0.5)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      font-size: 14px;
      width: ${theme.spacing(4)};
      right: ${theme.spacing(1.5)};
    }
  `}

  ${({ theme }) => css`
    ${theme.breakpoints.up('lg')} {
      font-size: 21px;
      width: ${theme.spacing(6)};
      right: ${theme.spacing(2)};
    }
  `}
`;

const imageStyles = css`
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

export const ArchiveSlider = ({ teasers, setTeaser }: ArchiveSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(2);

  const [sliderRef] = useKeenSlider({
    initial: currentSlide,
    mode: 'free-snap',
    loop: false,
    slides: {
      origin: 'center',
      perView: 6,
    },
    renderMode: 'custom',
  });

  return (
    <SliderWrapper
      ref={sliderRef}
      className="keen-slider"
    >
      {teasers.map(
        (teaser, index) =>
          teaser && (
            <ArchiveSlide
              key={index}
              teaser={teaser}
              isCurrent={index === currentSlide}
              onClick={() => {
                setCurrentSlide(index);
                setTeaser(teaser);
              }}
            />
          )
      )}
    </SliderWrapper>
  );
};

type ArchiveSlideProps = {
  teaser: Teaser;
  isCurrent: boolean;
  onClick: DOMAttributes<HTMLDivElement>['onClick'];
};

const ArchiveSlide = ({ teaser, onClick, isCurrent }: ArchiveSlideProps) => {
  const {
    elements: { Image },
    date,
  } = useWebsiteBuilder();

  const img = teaser && selectTeaserImage(teaser);
  const publishDate = teaser && selectTeaserDate(teaser);

  return (
    <Slide
      isCurrent={isCurrent}
      onClick={onClick}
    >
      {img && (
        <Image
          image={img}
          css={imageStyles}
        />
      )}
      {publishDate && (
        <ArchiveDate>{date.format(new Date(publishDate), false)}</ArchiveDate>
      )}
    </Slide>
  );
};
