import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  hasBlockStyle,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  BuilderTeaserSlotsBlockProps,
  Button,
  Link,
} from '@wepublish/website/builder';

import { WepBlockStyles } from '../block-styles/wep-block-styles';
import {
  TeaserSlotsTeasers,
  WepTeaserSlots,
} from '../teaser-layouts/wep-teaser-slots';
import { blockGap } from '../wep-content-wrapper';
import { heroBackground } from './hero';

export const isHeroLinks = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.HeroLinks)({ blockStyle });

export const HeroLinks = styled(WepTeaserSlots)`
  // Also covers the gap to the hero above (1px more against a hairline seam)
  ${({ theme }) =>
    heroBackground(theme, `calc(${theme.spacing(blockGap.xs)} + 1px)`)}
  display: block;
  padding-bottom: ${({ theme }) => theme.spacing(8)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    clip-path: inset(
      calc(-${({ theme }) => theme.spacing(blockGap.md)} - 1px) -100vmax 0
    );
    padding-bottom: ${({ theme }) => theme.spacing(16)};
  }

  ${TeaserSlotsTeasers} {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      flex-direction: row;
      gap: 50px;
    }
  }
`;

export const HeroLinkWrapper = styled('article')`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 30px;

  // Title above the button, so that the three links fit next to each other
  ${({ theme }) => theme.breakpoints.up('md')} {
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 15px;

    & + & {
      border-left: 1px solid ${({ theme }) => theme.palette.common.black};
      padding-left: 50px;
    }
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    flex-direction: row;
    align-items: flex-end;
    gap: 30px;
  }
`;

export const HeroLinkTitle = styled('h2')`
  margin: 0;
  // As wide as the longest word: "Gründen &" / "Transformieren"
  width: min-content;
  hyphens: manual;
  word-break: normal;
`;

export const HeroLinkButton = styled(Button)`
  ${({ theme }) => theme.typography.teaserMeta as CSSObject}
  flex-shrink: 0;
  border: 1.5px solid ${({ theme }) => theme.palette.common.black};
  border-radius: 3px;
  padding: 7px 15px;
  text-transform: none;
  background-color: transparent;
  color: ${({ theme }) => theme.palette.common.black};

  &:hover {
    border-width: 1.5px;
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

export const HeroLink = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const label = teaser && selectTeaserPreTitle(teaser);
  const href = teaser && selectTeaserUrl(teaser);
  const target = (teaser && selectTeaserTarget(teaser)) ?? undefined;

  return (
    <HeroLinkWrapper className={className}>
      {title && (
        <Typography
          variant="h4"
          component={HeroLinkTitle}
        >
          {title}
        </Typography>
      )}

      {href && label && (
        <HeroLinkButton
          variant="outlined"
          LinkComponent={Link}
          href={href}
          target={target}
        >
          {label}
        </HeroLinkButton>
      )}
    </HeroLinkWrapper>
  );
};
