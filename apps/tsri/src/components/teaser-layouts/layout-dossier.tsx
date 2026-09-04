import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import { FlexAlignment } from '@wepublish/website/api';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { ComponentProps } from 'react';

import { StyledTeaserMoreAbout } from '../teasers/teaser-more-about';
import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TeaserContentWrapper, TeaserLead } from '../teasers/tsri-teaser';
import { TsriLayoutType } from './tsri-layout';
import { TeaserSlots } from './tsri-layout';

export const teaserBlockStyleByIndex = (index: number): TsriTeaserType => {
  switch (index) {
    case 0:
      return TsriTeaserType.MoreAbout;
    default:
      return TsriTeaserType.TwoCol;
  }
};

export const alignmentForTeaserBlock = (
  index: number,
  count?: number
): FlexAlignment => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 1, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };

  // Row 1 is taken by the full-width DossierTitle, teasers start at row 2.
  const twoColRowCount = Math.max(1, Math.ceil(((count ?? 1) - 1) / 2));

  if (index === 0) {
    return { ...alignment, y: 1, h: twoColRowCount };
  }

  return {
    ...alignment,
    x: 1 + ((index - 1) % 2),
    y: 1 + Math.floor((index - 1) / 2),
  };
};

export const isTeaserSlotsDossier = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.Dossier;
  },
]);

const DossierSlots = styled(TeaserSlots)`
  background: linear-gradient(
    to bottom,
    ${({ theme }: { theme: Theme }) => theme.palette.primary.dark} 0%,
    color-mix(
      in srgb,
      ${({ theme }: { theme: Theme }) => theme.palette.common.white} 60%,
      ${({ theme }: { theme: Theme }) => theme.palette.primary.dark}
    )
  );
  border-radius: 1cqw;

  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-template-columns: 1fr;
    padding: 2cqw;
    column-gap: 2.2cqw;
    row-gap: 4cqw;

    ${StyledTeaserMoreAbout} {
      align-content: start;

      ${TeaserContentWrapper} {
        align-content: start;
        padding-top: 0;
      }
    }
  }

  ${StyledTeaserMoreAbout} ${TeaserLead} {
    color: ${({ theme }: { theme: Theme }) => theme.palette.common.black};
    display: block;
    font-size: 4.5cqw;
    line-height: 1.2;
    font-weight: 600;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 1.7cqw;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0.75cqw 0 1.5cqw 0;
    grid-template-columns: 1fr 32.5cqw 32.5cqw !important;
    column-gap: 2.2cqw;
    row-gap: 1.77cqw;
  }
`;

export const DossierTitle = styled('h2')`
  grid-column: 1 / -1;
  margin: 0;
  color: ${({ theme }: { theme: Theme }) => theme.palette.common.white};
  font-size: 5cqw;
  line-height: 1.2;
  padding-bottom: ${({ theme }: { theme: Theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 1.5cqw;
  }
`;

export const TeaserSlotsDossier = (
  props: ComponentProps<typeof DossierSlots>
) => (
  <DossierSlots {...props}>
    {props.title && <DossierTitle>{props.title}</DossierTitle>}
  </DossierSlots>
);
