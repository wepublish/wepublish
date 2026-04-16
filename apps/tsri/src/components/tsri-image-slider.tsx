import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  ImageSlider,
  SliderArrow,
  SliderBall,
  SliderBallContainer,
  SliderBallFill,
  SliderInnerContainer,
  SlidesContainer,
} from '@wepublish/block-content/website';
import {
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
} from '@wepublish/block-content/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';
import { useCallback, useEffect, useRef, useState } from 'react';

const hintFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const hintFadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const SwipeHintBase = ({
  className,
  onAnimationEnd,
}: {
  state: 'showing' | 'fading';
  className?: string;
  onAnimationEnd?: () => void;
}) => (
  <div
    className={className}
    onAnimationEnd={onAnimationEnd}
  >
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="22"
        cy="22"
        r="22"
        fill="black"
        fillOpacity="0.7"
      />
      <path
        d="M18 13l10 9-10 9"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  </div>
);

const SwipeHint = styled(SwipeHintBase)<{ state: 'showing' | 'fading' }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(calc(-50% - 20px));
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  animation: ${({ state }) => (state === 'showing' ? hintFadeIn : hintFadeOut)}
    0.4s ease forwards;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const SliderWrapper = styled('div', {
  shouldForwardProp: p => p !== 'slideTotal',
})<{ slideTotal: number }>`
  position: relative;
  --slide-total: '${({ slideTotal }) => slideTotal}';
`;

const ClipPathBase = ({
  clipRatio,
  className,
}: {
  clipRatio: number;
  className?: string;
}) => (
  <svg className={className}>
    <defs>
      <clipPath
        id="slider-clip"
        clipPathUnits="objectBoundingBox"
      >
        <path
          d={`
              M 0.03 0
              H 0.97
              Q 1 0 1 0.02
              V ${clipRatio - 0.02}
              Q 1 ${clipRatio} 0.97 ${clipRatio}
              H 0.03
              Q 0 ${clipRatio} 0 ${clipRatio - 0.02}
              V 0.02
              Q 0 0 0.03 0
              Z
              M 0 ${clipRatio}
              H 1
              V 1
              H 0
              Z
            `}
        />
      </clipPath>
    </defs>
  </svg>
);

const ClipPath = styled(ClipPathBase)<{ clipRatio: number }>`
  position: absolute;
  width: 0;
  height: 0;
`;

const ImageSliderBase = ({
  images,
  className,
}: BuilderBlockStyleProps['ImageSlider']) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [clipRatio, setClipRatio] = useState(0.85);
  const [hintState, setHintState] = useState<
    'idle' | 'showing' | 'fading' | 'done'
  >('idle');

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const slide = el.querySelector('.keen-slider__slide');
    const img = slide?.querySelector('img');
    if (!slide || !img) return;

    const update = () => {
      const slideH = slide.getBoundingClientRect().height;
      const imgH = img.getBoundingClientRect().height;
      if (slideH > 0) setClipRatio(imgH / slideH);
    };

    update();
    img.addEventListener('load', update);
    return () => img.removeEventListener('load', update);
  }, [images]);

  const showHint = useCallback(() => {
    if (hintState !== 'idle') return;
    setTimeout(() => {
      setHintState('showing');
      setTimeout(() => setHintState('fading'), 3000);
    }, 1000);
  }, [hintState]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || hintState !== 'idle') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          showHint();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isDesktop, showHint, hintState]);

  return (
    <SliderWrapper
      ref={wrapperRef}
      className={className}
      slideTotal={images.length}
    >
      {(hintState === 'showing' || hintState === 'fading') && (
        <SwipeHint
          state={hintState as 'showing' | 'fading'}
          onAnimationEnd={() => hintState === 'fading' && setHintState('done')}
        />
      )}

      <ClipPath clipRatio={clipRatio} />

      <ImageSlider
        images={images}
        slidesPerViewConfig={{
          xs: 'auto',
          sm: 'auto',
          md: 'auto',
          lg: 'auto',
          xl: 'auto',
        }}
        slideGap={10}
      />
    </SliderWrapper>
  );
};

export const TsriImageSlider = styled(ImageSliderBase)`
  margin: 0;
  container: slidescontainer / inline-size;
  --sizing-factor: 2.9;

  ${({ theme }) => theme.breakpoints.up('md')} {
    --sizing-factor: 1;
  }

  ${SliderInnerContainer} {
    row-gap: ${({ theme }) => theme.spacing(2)};

    ${SlidesContainer} {
      flex-shrink: 0;
      grid-column: -1 / 1;
      grid-row: 1 / 2;
      z-index: 2;
      clip-path: url(#slider-clip);
    }

    ${SliderBallContainer} {
      grid-column: -1 / 1;
      grid-row: 1 / 2;
      padding: ${({ theme }) => theme.spacing(0)};
      align-content: end;

      ${SliderArrow} {
        display: none;
        transform: translateY(0);
        height: 66.666cqw;
        width: 50%;
        top: 0;
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.5),
          transparent 80%
        );
        border-radius: calc(var(--sizing-factor) * 2cqw);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        opacity: 0;
        transition: opacity 0.25s ease;

        ${({ theme }) => theme.breakpoints.up('md')} {
          display: block;
        }

        &:hover {
          opacity: 1;
        }

        & + ${SliderArrow} {
          background: linear-gradient(
            to left,
            rgba(0, 0, 0, 0.5),
            transparent 80%
          );
          border-radius: calc(var(--sizing-factor) * 2cqw);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;

          &:hover {
            opacity: 1;
          }
        }

        svg {
          display: none;
        }
      }
    }

    ${SliderBallFill} {
      background-color: transparent;
    }

    ${SliderBall} {
      display: none;
    }
  }

  .keen-slider {
    counter-reset: slide;
  }

  .keen-slider__slide {
    counter-increment: slide;
    padding: 0 0 ${({ theme }) => theme.spacing(3)} 0;
    width: 100cqw !important;
    flex-shrink: 0;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 0;
    }

    ${ImageBlockWrapper} {
      height: 100%;

      ${ImageBlockInnerWrapper} {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 66.666cqw auto;
        row-gap: ${({ theme }) => theme.spacing(1)};

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          grid-row: 1 / 2;
          grid-column: -1 / 1;
          min-width: 100cqw;
        }

        figcaption {
          grid-row: 2 / 3;
          grid-column: -1 / 1;
          font-size: 0.75rem;
          line-height: 1rem;
          font-weight: 700;
          color: ${({ theme }) => theme.palette.common.black};
          width: 100%;

          &::before {
            content: counter(slide) '/' var(--slide-total) '\\00a0\\00a0';
            color: ${({ theme }) => theme.palette.primary.main};
          }
        }
      }
    }
  }
`;
