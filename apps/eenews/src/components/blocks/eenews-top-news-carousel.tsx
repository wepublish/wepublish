import 'keen-slider/keen-slider.min.css';

import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { useKeenSlider } from 'keen-slider/react';
import { useEffect, useMemo, useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

import { EenewsTeaser } from './eenews-teaser';

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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px 32px;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
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

const PER_PAGE = 3;

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1 },
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
  });

  const pages = useMemo(() => {
    const filled = (teasers ?? []).filter(isFilledTeaser);
    const out: (typeof filled)[] = [];
    for (let i = 0; i < filled.length; i += PER_PAGE) {
      out.push(filled.slice(i, i + PER_PAGE));
    }
    return out;
  }, [teasers]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => instanceRef.current?.update());
    return () => cancelAnimationFrame(frame);
  }, [instanceRef, pages.length]);

  if (!pages.length) {
    return null;
  }

  return (
    <Section className={className}>
      <Head>
        <Title variant="sectionTitle">{title ?? 'Top-News'}</Title>
      </Head>
      <Stage>
        <CarouselBtn
          side="left"
          aria-label="Zurück"
          onClick={() => instanceRef.current?.prev()}
          type="button"
        >
          <MdChevronLeft size={22} />
        </CarouselBtn>
        <CarouselBtn
          side="right"
          aria-label="Weiter"
          onClick={() => instanceRef.current?.next()}
          type="button"
        >
          <MdChevronRight size={22} />
        </CarouselBtn>

        <Viewport
          ref={sliderRef}
          className="keen-slider"
        >
          <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
            {pages.map((page, pageIdx) => (
              <Slide
                key={pageIdx}
                className="keen-slider__slide"
              >
                {page.map((teaser, slotIdx) => (
                  <Teaser
                    key={`${pageIdx}-${slotIdx}`}
                    teaser={teaser}
                    index={pageIdx * PER_PAGE + slotIdx}
                    blockStyle={blockStyle}
                    numColumns={3}
                    alignment={{
                      i: `${pageIdx}-${slotIdx}`,
                      x: 0,
                      y: 0,
                      w: 4,
                      h: 1,
                    }}
                  />
                ))}
              </Slide>
            ))}
          </WebsiteBuilderProvider>
        </Viewport>

        <Dots>
          {pages.map((_, idx) => (
            <Dot
              key={idx}
              active={idx === currentSlide}
              aria-label={`Seite ${idx + 1}`}
              onClick={() => instanceRef.current?.moveToIdx(idx)}
              type="button"
            />
          ))}
        </Dots>
      </Stage>
    </Section>
  );
};
