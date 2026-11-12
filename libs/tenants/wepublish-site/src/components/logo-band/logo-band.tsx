import { css, CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isFilledTeaser,
  selectTeaserImage,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  Button,
  Image,
  Link,
} from '@wepublish/website/builder';
import { RefObject, useRef } from 'react';

import { designText } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { tertiaryButtonOnDark } from '../button-styles';
import { HeroLinks } from '../hero/hero-links';
import { extraColumn } from '../page-columns';
import { blockGap } from '../wep-content-wrapper';
import { useLogoBandScroll } from './use-logo-band-scroll';

export const isLogoBand = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.LogoBand)({ blockStyle });

export const LogoBandWrapper = styled('section')`
  // The dark colour over the full viewport width
  background-color: ${({ theme }) => theme.palette.primary.dark};
  box-shadow: 0 0 0 100vmax ${({ theme }) => theme.palette.primary.dark};
  clip-path: inset(0 -100vmax);
  display: grid;
  gap: 30px;
  padding: 30px 0;
  color: ${({ theme }) => theme.palette.common.white};

  // Right below the hero, without a white gap in between (every block sits in its own container)
  *:has(> ${HeroLinks}) + * > & {
    margin-top: calc(-${({ theme }) => theme.spacing(blockGap.xs)} - 1px);

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin-top: calc(-${({ theme }) => theme.spacing(blockGap.md)} - 1px);
    }
  }
`;

export const LogoBandHeader = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  // All 12 columns, as wide as the navbar
  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-inline: calc(
      -1 * ${({ theme }) => extraColumn(theme, '100%', '100vw')}
    );
  }
`;

export const LogoBandTitle = styled('h2')`
  ${designText.textSmallMono as CSSObject}
  margin: 0;
`;

export const LogoBandButton = styled(Button)`
  ${({ theme }) => tertiaryButtonOnDark(theme)}
`;

// Runs from the left to the right edge of the viewport and scrolls sideways
export const LogoBandViewport = styled('div')`
  margin-inline: calc(50% - 50vw);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  user-select: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &[data-dragging='true'] {
    cursor: grabbing;
  }
`;

export const LogoBandTrack = styled('div')`
  display: flex;
  width: max-content;
`;

const logoGap = css`
  gap: 30px;
  padding-right: 30px;
`;

export const LogoBandList = styled('ul')`
  ${logoGap}
  display: flex;
  align-items: center;
  margin: 0;
  padding-left: 0;
  list-style: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 50px;
    padding-right: 50px;
  }

  // Only the moving band needs a second set of logos
  &[aria-hidden='true'] {
    @media (prefers-reduced-motion: reduce) {
      display: none;
    }
  }
`;

export const LogoBandLink = styled('a')`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 28px;
  cursor: inherit;
  -webkit-user-drag: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 80px;
    height: 35px;
  }
`;

export const LogoBandImage = styled(Image)`
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  // Every logo in white, whatever colour it was uploaded in
  filter: brightness(0) invert(1);
  pointer-events: none;
`;

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const logoName = (teaser: FullTeaserFragment) => {
  const image = selectTeaserImage(teaser);

  return (
    selectTeaserTitle(teaser) ||
    image?.description ||
    image?.title ||
    hostname(selectTeaserUrl(teaser) ?? '')
  );
};

const LogoList = ({
  logos,
  isCopy,
  listRef,
}: {
  logos: FullTeaserFragment[];
  isCopy?: boolean;
  listRef?: RefObject<HTMLUListElement | null>;
}) => (
  <LogoBandList
    ref={listRef}
    aria-hidden={isCopy || undefined}
  >
    {logos.map((teaser, index) => {
      const image = selectTeaserImage(teaser);

      return (
        <li key={index}>
          <LogoBandLink
            as={Link}
            href={selectTeaserUrl(teaser) ?? undefined}
            target={selectTeaserTarget(teaser) ?? undefined}
            aria-label={logoName(teaser)}
            tabIndex={isCopy ? -1 : undefined}
            draggable={false}
          >
            {image && <LogoBandImage image={image} />}
          </LogoBandLink>
        </li>
      );
    })}
  </LogoBandList>
);

/**
 * The logos of the media in a band that runs endlessly. A teaser without
 * image is the button next to the title, with its pre-title as label.
 */
export const LogoBand = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => {
  const filledTeasers = teasers.filter(isFilledTeaser);
  const logos = filledTeasers.filter(teaser => selectTeaserImage(teaser));
  const callToAction = filledTeasers.find(teaser => !selectTeaserImage(teaser));
  const callToActionLabel = callToAction && selectTeaserPreTitle(callToAction);
  const callToActionUrl = callToAction && selectTeaserUrl(callToAction);
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstListRef = useRef<HTMLUListElement>(null);
  const scrollHandlers = useLogoBandScroll(viewportRef, firstListRef);

  return (
    <LogoBandWrapper className={className}>
      {logos.length > 0 && (
        <LogoBandViewport
          ref={viewportRef}
          {...scrollHandlers}
        >
          <LogoBandTrack>
            <LogoList
              logos={logos}
              listRef={firstListRef}
            />
            <LogoList
              logos={logos}
              isCopy
            />
          </LogoBandTrack>
        </LogoBandViewport>
      )}

      {(title || callToActionLabel) && (
        <LogoBandHeader>
          {title && <LogoBandTitle>{title}</LogoBandTitle>}

          {callToActionLabel && callToActionUrl && (
            <LogoBandButton
              variant="outlined"
              disableRipple
              LinkComponent={Link}
              href={callToActionUrl}
              target={selectTeaserTarget(callToAction) ?? undefined}
            >
              {callToActionLabel}
            </LogoBandButton>
          )}
        </LogoBandHeader>
      )}
    </LogoBandWrapper>
  );
};
