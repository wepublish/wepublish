import 'keen-slider/keen-slider.min.css';

import styled from '@emotion/styled';
import { useKeenSlider } from 'keen-slider/react';
import {
  DOMAttributes,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdFilterNone,
  MdFullscreen,
  MdFullscreenExit,
  MdArrowBackIosNew,
  MdArrowForwardIos,
} from 'react-icons/md';

import { BuilderBlockStyleProps, ImageBlock } from '@wepublish/website/builder';
import { ImageWrapper } from '@wepublish/image/website';
import {
  ImageBlockCaption,
  ImageBlockInnerWrapper,
} from '../../image/image-block';
import { css } from '@emotion/react';
import { Theme } from '@mui/material';

export const LightboxImage = styled(ImageBlock)`
  justify-items: initial;

  ${ImageBlockInnerWrapper} {
    position: relative;
    grid-template-rows: auto auto;
    justify-items: center;

    &::before {
      content: '';
      grid-area: 1 / 1;
      justify-self: stretch;
      height: var(--lightbox-image-height);
      aspect-ratio: var(--lightbox-image-aspect-ratio);
      background-color: ${({ theme }) => theme.palette.grey[200]};
    }

    > a,
    > ${ImageWrapper} {
      grid-area: 1 / 1 / 2 / 2;
      position: absolute;
      inset: 0;
      margin: auto;
    }

    > a {
      display: grid;
      justify-items: center;
    }
  }

  ${ImageWrapper} {
    height: 100%;
    width: auto;
    max-width: 100%;
    max-height: none;
    aspect-ratio: auto;
    object-fit: cover;
  }

  ${ImageBlockCaption} {
    grid-row: 2;
    width: initial;
    justify-self: start;
  }
`;

export const LightboxStage = styled('div')`
  position: relative;
  display: grid;
`;

export const LightboxSlides = styled('div')``;

export const LightboxSlide = styled('div')`
  display: grid;
`;

export const LightboxWrapper = styled('section')<{ fullscreen: boolean }>`
  display: grid;
  --lightbox-image-height: 350px;
  --lightbox-image-aspect-ratio: auto;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    --lightbox-image-height: 500px;
  }

  ${({ fullscreen, theme }) =>
    fullscreen &&
    css`
      position: fixed;
      inset: 0;
      z-index: ${theme.zIndex.modal};
      margin: 0;
      padding: ${theme.spacing(2)};
      background-color: #000;
      color: #fff;
      grid-template-rows: minmax(0, 1fr);

      ${LightboxStage} {
        min-height: 0;
        grid-template-rows: minmax(0, 1fr);
      }

      ${LightboxSlides} {
        height: 100%;
        min-height: 0;
      }

      ${LightboxSlide} {
        grid-template-rows: minmax(0, 1fr);
      }

      ${LightboxImage} {
        min-height: 0;
        grid-template-rows: minmax(0, 1fr);
      }

      ${ImageBlockInnerWrapper} {
        height: 100%;
        min-height: 0;
        grid-template-rows: 1fr auto;

        &::before {
          height: auto;
          aspect-ratio: auto;
          background-color: transparent;
        }
      }

      ${ImageWrapper} {
        width: 100%;
        height: 100%;
        min-height: 0;
        object-fit: contain;
      }

      ${ImageBlockCaption} {
        color: #fff;
      }
    `}
`;

const controlStyles = (theme: Theme) => css`
  appearance: none;
  border: none;
  display: flex;
  align-items: center;
  gap: ${theme.spacing(1)};
  padding: ${theme.spacing(1, 1.5)};
  border-radius: ${theme.shape.borderRadius}px;
  background-color: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 1em;
  font-weight: 500;
  line-height: 1;
  position: absolute;
  z-index: 2;
`;

export const LightboxCounter = styled('div')`
  ${({ theme }) => controlStyles(theme)}
  top: ${({ theme }) => theme.spacing(1.5)};
  left: ${({ theme }) => theme.spacing(1.5)};
`;

export const LightboxFullscreenButton = styled('button')`
  ${({ theme }) => controlStyles(theme)}
  top: ${({ theme }) => theme.spacing(1.5)};
  right: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

export const LightboxArrow = styled('button')`
  ${({ theme }) => controlStyles(theme)}
  top: 50%;
  left: ${({ theme }) => theme.spacing(1.5)};
  transform: translateY(-50%);
  border-radius: 50%;
  padding: ${({ theme }) => theme.spacing(1)};
  cursor: pointer;

  &:last-of-type {
    left: initial;
    right: ${({ theme }) => theme.spacing(1.5)};
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const pixelSwipeThreshold = 50;

export const Lightbox = ({
  images,
  dragDisabled = false,
  animationDisabled = true,
  dragAnimationDisabled = false,
  className,
}: BuilderBlockStyleProps['Lightbox']) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const historyId = useId();
  const { t } = useTranslation();

  const swipeStart = useRef<number | null>(null);

  const count = images.length;
  const multiple = count > 1;

  const [ref, sliderRef] = useKeenSlider({
    loop: multiple,
    drag: multiple && !dragDisabled && !dragAnimationDisabled,
    defaultAnimation: animationDisabled ? { duration: 0 } : undefined,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  const swipeWithoutAnimation = useMemo(
    () =>
      (multiple && !dragDisabled && dragAnimationDisabled ?
        {
          onPointerDown: event => (swipeStart.current = event.clientX),
          onPointerUp: event => {
            if (swipeStart.current == null) {
              return;
            }

            const distance = event.clientX - swipeStart.current;
            swipeStart.current = null;

            if (distance <= -pixelSwipeThreshold) {
              sliderRef.current?.next();
            }

            if (distance >= pixelSwipeThreshold) {
              sliderRef.current?.prev();
            }
          },
          onPointerCancel: () => (swipeStart.current = null),
          onDragStart: event => event.preventDefault(),
        }
      : {}) satisfies Partial<DOMAttributes<HTMLDivElement>>,
    [dragAnimationDisabled, dragDisabled, multiple, sliderRef]
  );

  const openFullscreen = () => {
    window.history.pushState({ lightbox: historyId }, '');
    setFullscreen(true);
  };

  const closeFullscreen = useCallback(() => {
    if (window.history.state?.lightbox === historyId) {
      window.history.back();
      return;
    }

    setFullscreen(false);
  }, [historyId]);

  useEffect(() => {
    // keen-slider only measures on window resize
    const frame = requestAnimationFrame(() => sliderRef.current?.update());
    return () => cancelAnimationFrame(frame);
  }, [sliderRef, fullscreen]);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }

    const onPopState = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      setFullscreen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullscreen();
      }

      if (event.key === 'ArrowLeft') {
        sliderRef.current?.prev();
      }

      if (event.key === 'ArrowRight') {
        sliderRef.current?.next();
      }
    };

    window.addEventListener('popstate', onPopState, { capture: true });
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('popstate', onPopState, { capture: true });
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen, closeFullscreen, sliderRef]);

  if (!count) {
    return null;
  }

  return (
    <LightboxWrapper
      className={className}
      fullscreen={fullscreen}
      data-fullscreen={fullscreen}
    >
      <LightboxStage>
        <LightboxSlides
          ref={ref}
          className="keen-slider"
          {...swipeWithoutAnimation}
        >
          {images.map((image, index) => (
            <LightboxSlide
              key={index}
              className="keen-slider__slide"
            >
              <LightboxImage
                caption={image.caption}
                image={image.image}
                linkUrl={null}
              />
            </LightboxSlide>
          ))}
        </LightboxSlides>

        <LightboxCounter aria-live="polite">
          <MdFilterNone size={20} />

          <span>
            {currentSlide + 1} / {count}
          </span>
        </LightboxCounter>

        <LightboxFullscreenButton
          type="button"
          onClick={fullscreen ? closeFullscreen : openFullscreen}
          aria-label={
            fullscreen ? t('lightbox.exitFullscreen') : t('lightbox.fullscreen')
          }
        >
          {fullscreen ?
            <MdFullscreenExit size={24} />
          : <MdFullscreen size={24} />}
        </LightboxFullscreenButton>

        {multiple && (
          <>
            <LightboxArrow
              type="button"
              onClick={() => sliderRef.current?.prev()}
              aria-label={t('lightbox.previous')}
            >
              <MdArrowBackIosNew size={22} />
            </LightboxArrow>

            <LightboxArrow
              type="button"
              onClick={() => sliderRef.current?.next()}
              aria-label={t('lightbox.next')}
            >
              <MdArrowForwardIos size={22} />
            </LightboxArrow>
          </>
        )}
      </LightboxStage>
    </LightboxWrapper>
  );
};
