import 'keen-slider/keen-slider.min.css';

import styled from '@emotion/styled';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { useKeenSlider } from 'keen-slider/react';
import { useEffect, useMemo, useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

import { EenewsTeaser } from '../teasers/eenews-teaser';

const Section = styled('section')`
  background: ${({ theme }) => theme.palette.background.paper};
  padding: 56px 56px 36px;
  ${({ theme }) => theme.breakpoints.down('lg')} {
    padding: 36px 20px 24px;
  }
`;

const Head = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto 28px;
`;

const Title = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin: 0;
`;

const Stage = styled('div')`
  position: relative;
  max-width: var(--max-width);
  margin: 0 auto;
  container-type: inline-size;
`;

const Viewport = styled('div')`
  overflow: hidden;
`;

const Slide = styled('div')`
  height: 100%;
  min-width: 100%;
  ${({ theme }) => theme.breakpoints.up('sm')} {
    min-width: calc(50% - 12px);
  }
  ${({ theme }) => theme.breakpoints.up('lg')} {
    min-width: calc((100% - 64px) / 3);
  }
`;

const CarouselBtn = styled('button')<{ side: 'left' | 'right' }>`
  position: absolute;
  top: calc((100cqw - 64px) / 8 - 23px);
  ${({ side }) => (side === 'left' ? 'left: 0;' : 'right: 0;')}
  transform: translateX(${({ side }) => (side === 'left' ? '-50%' : '50%')});
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 0;
  background: ${({ theme }) => theme.palette.primary.main};
  color: #e7ffda;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: 3;
  transition:
    background 140ms,
    transform 140ms;
  &:hover {
    background: ${({ theme }) => theme.palette.primary.dark};
  }
  ${({ theme }) => theme.breakpoints.down('lg')} {
    display: none;
  }
`;

const Dots = styled('div')`
  max-width: var(--max-width);
  margin: 28px auto 0;
  display: flex;
  gap: 14px;
  justify-content: center;
  align-items: center;
`;

const Dot = styled('button')<{ active: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.palette.primary.main};
  background: ${({ theme, active }) =>
    active ? theme.palette.primary.main : 'transparent'};
  padding: 0;
  cursor: pointer;
  transition:
    background 160ms,
    transform 160ms;
  &:hover {
    transform: scale(1.1);
  }
`;

const useSliderConfig = () => {
  const theme = useTheme();
  const lg = useMediaQuery(theme.breakpoints.up('lg'), {
    ssrMatchMedia: () => ({ matches: false }),
  });
  const sm = useMediaQuery(theme.breakpoints.up('sm'), {
    ssrMatchMedia: () => ({ matches: false }),
  });

  if (lg) {
    return { perView: 3, spacing: 32 };
  }
  if (sm) {
    return { perView: 2, spacing: 24 };
  }
  return { perView: 1, spacing: 16 };
};

export const EenewsTopNewsCarousel = ({
  title,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  // Hooks — all called unconditionally, at the top, in a fixed order.
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const { perView, spacing } = useSliderConfig();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView, spacing },
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
  });

  const filled = useMemo(
    () => (teasers ?? []).filter(isFilledTeaser),
    [teasers]
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => instanceRef.current?.update());
    return () => cancelAnimationFrame(frame);
  }, [instanceRef, perView, spacing, filled.length]);

  if (!filled.length) {
    return null;
  }

  const pageCount = Math.ceil(filled.length / perView);
  const currentPage = Math.floor(currentSlide / perView);

  return (
    <Section className={className}>
      <Head>
        <Title variant="sectionTitle">{title ?? 'Top-News'}</Title>
      </Head>
      <Stage>
        <CarouselBtn
          side="left"
          aria-label="Zurück"
          onClick={() =>
            instanceRef.current?.moveToIdx((currentPage - 1) * perView)
          }
          type="button"
        >
          <MdChevronLeft size={22} />
        </CarouselBtn>
        <CarouselBtn
          side="right"
          aria-label="Weiter"
          onClick={() =>
            instanceRef.current?.moveToIdx((currentPage + 1) * perView)
          }
          type="button"
        >
          <MdChevronRight size={22} />
        </CarouselBtn>

        <Viewport
          ref={sliderRef}
          className="keen-slider"
        >
          <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
            {filled.map((teaser, idx) => (
              <Slide
                key={idx}
                className="keen-slider__slide"
              >
                <Teaser
                  teaser={teaser}
                  index={idx}
                  blockStyle={blockStyle}
                  numColumns={3}
                  alignment={{
                    i: String(idx),
                    x: 0,
                    y: 0,
                    w: 4,
                    h: 1,
                  }}
                />
              </Slide>
            ))}
          </WebsiteBuilderProvider>
        </Viewport>

        <Dots>
          {Array.from({ length: pageCount }).map((_, idx) => (
            <Dot
              key={idx}
              active={idx === currentPage}
              aria-label={`Seite ${idx + 1}`}
              onClick={() => instanceRef.current?.moveToIdx(idx * perView)}
              type="button"
            />
          ))}
        </Dots>
      </Stage>
    </Section>
  );
};
