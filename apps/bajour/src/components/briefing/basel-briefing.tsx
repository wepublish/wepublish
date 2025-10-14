import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { Image } from '@wepublish/image/website';
import { NextWepublishLink } from '@wepublish/utils/website';
import { CustomTeaser, FullImageFragment } from '@wepublish/website/api';
import { BuilderTeaserGridBlockProps } from '@wepublish/website/builder';

import { isWithinTimeslot } from '../../utils/is-within-timeslot';
import { fluidTypography } from '../website-builder-overwrites/blocks/teaser-overwrite.style';
import BaselBg from './basel.jpg';
import EscBg from './esc.jpg';
import FasnachtBg from './fasnacht.jpg';
import FcbBg from './fcb.jpg';
import { BriefingType } from './is-briefing';

export type BaselBriefingProps = Omit<
  BuilderTeaserGridBlockProps,
  'teasers'
> & {
  teasers?: CustomTeaser[];
};

const baselBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: BaselBg.src,
  xl: BaselBg.src,
  l: BaselBg.src,
  m: BaselBg.src,
  s: BaselBg.src,
  xs: BaselBg.src,
  xxs: BaselBg.src,
} satisfies FullImageFragment;

const fcbBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: FcbBg.src,
  xl: FcbBg.src,
  l: FcbBg.src,
  m: FcbBg.src,
  s: FcbBg.src,
  xs: FcbBg.src,
  xxs: FcbBg.src,
} satisfies FullImageFragment;

const fasnachtBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: FasnachtBg.src,
  xl: FasnachtBg.src,
  l: FasnachtBg.src,
  m: FasnachtBg.src,
  s: FasnachtBg.src,
  xs: FasnachtBg.src,
  xxs: FasnachtBg.src,
} satisfies FullImageFragment;

const escBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: EscBg.src,
  xl: EscBg.src,
  l: EscBg.src,
  m: EscBg.src,
  s: EscBg.src,
  xs: EscBg.src,
  xxs: EscBg.src,
} satisfies FullImageFragment;

const getValuesBasedOnBriefing = (briefing: BriefingType) => {
  switch (briefing) {
    case BriefingType.BaselBriefing: {
      return {
        title: 'Basel Briefing',
        subtitle: 'Das wichtigste für den tag',
        backgroundImage: baselBg,
        welcome: 'Guten Morgen!',
      };
    }

    case BriefingType.FCBBriefing: {
      return {
        title: 'FCB Briefing',
        subtitle: 'DAS WICHTIGSTE VOR JEDEM SPIEL',
        backgroundImage: fcbBg,
        welcome: 'Sali!',
      };
    }

    case BriefingType.FasnachtsBriefing: {
      return {
        title: 'FASNACHTS-BRIEFING',
        subtitle: 'DEINE FASNÄCHTLICHE GRUNDVERSORGUNG',
        backgroundImage: fasnachtBg,
        welcome: 'Sali!',
      };
    }

    case BriefingType.EscBriefing: {
      return {
        title: 'ESC-Briefing',
        subtitle: 'Das Wichtigste für den Event des Jahres',
        backgroundImage: escBg,
        welcome: 'Hello from Basel',
      };
    }
  }
};

export const BaselBriefingStyled = styled('div')`
  display: grid;
  column-gap: 16px;
  grid-template-columns: 1fr;
  align-items: stretch;
  position: relative;
  padding-top: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin-bottom: ${({ theme }) => theme.spacing(4)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-bottom: ${({ theme }) => theme.spacing(6)};
  }
`;

const TeaserBackground = styled(Image)`
  width: 100%;
  max-height: initial;
  object-fit: cover;
  position: absolute;
  z-index: -1;
  border-radius: ${({ theme }) => theme.spacing(2)}
    ${({ theme }) => theme.spacing(2)} 0 0;
  aspect-ratio: 4/3;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    aspect-ratio: 2.5/1;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    aspect-ratio: 3/1;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    border-radius: ${({ theme }) => theme.spacing(4)}
      ${({ theme }) => theme.spacing(4)} 0 0;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    grid-column: 3/12;
  }
`;

const LinkWrapper = styled(NextWepublishLink)`
  grid-column: -1/1;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: auto;
  align-items: center;
  grid-template-columns: 1fr;
`;

const TeaserContentWrapper = styled('div')`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  width: 100%;
`;

const ButtonRow = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: flex-end;
`;

const ReadMoreButton = styled(Button)`
  justify-self: end;
  color: ${({ theme }) => theme.palette.error.main};
`;

const TeaserContentStyled = styled('div')`
  padding: ${({ theme }) => theme.spacing(1)};
  grid-template-columns: repeat(12, 1fr);
  grid-column: 3/13;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column: 3/12;
    padding: ${({ theme }) => `${theme.spacing(2)} 0 ${theme.spacing(1.5)}`};
  }
`;

const Heading = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(4)};
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  width: 100%;
  text-align: center;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    margin-top: ${({ theme }) => theme.spacing(10)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-top: ${({ theme }) => theme.spacing(14)};
  }
`;

const BaselBriefingTitle = styled('span')`
  font-weight: bold;
  font-size: ${({ theme }) => theme.spacing(4)};
  text-transform: uppercase;
  text-shadow:
    1px 1px 2px rgba(0, 0, 0, 0.35),
    0 0 1em rgba(0, 0, 0, 0.35),
    0 0 0.2em rgba(0, 0, 0, 0.35);

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 3rem;
  }
`;

const BaselBriefingSubtitle = styled('span')`
  font-weight: bold;
  font-size: 0.8rem;
  text-transform: uppercase;
  text-shadow:
    1px 1px 2px rgba(0, 0, 0, 0.35),
    0 0 1em rgba(0, 0, 0, 0.35),
    0 0 0.2em rgba(0, 0, 0, 0.35);

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 1 ${({ theme }) => theme.spacing(4)};
  }
`;

const BriefingTextWrapper = styled('div')`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(12, 1fr);
`;

const Briefing = styled('div')`
  color: ${({ theme }) => theme.palette.common.white};
  background-color: rgba(0, 0, 0, 0.35);
  padding: ${({ theme }) =>
    `${theme.spacing(0.5)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`};
  font-size: ${fluidTypography(12, 26)};
  grid-column: 1/13;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column: 3/12;
    border-radius: ${({ theme }) => theme.spacing(2)}
      ${({ theme }) => theme.spacing(2)} 0 0;
    padding: ${({ theme }) =>
      `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(4)}`};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    border-radius: ${({ theme }) => theme.spacing(4)}
      ${({ theme }) => theme.spacing(4)} 0 0;
    padding: ${({ theme }) =>
      `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(4)}`};
  }
`;

const Welcome = styled('div')`
  font-weight: bold;
`;

const BriefingText = styled('div')``;

const BriefingContainer = styled('div')`
  position: relative;
  aspect-ratio: 4/3;
  display: grid;
  align-content: space-between;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    aspect-ratio: 2.5/1;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    aspect-ratio: 3/1;
  }
`;

const TeaserContentInterior = styled('div')`
  position: relative;
  grid-column: 3/13;
  display: grid;
  align-items: center;
  grid-template-columns: 3fr 4fr;
  padding: ${({ theme }) =>
    `${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(3.5)}`};
  border-bottom-right-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.secondary.dark};
  color: ${({ theme }) => theme.palette.common.black};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column: 3/12;
    padding: ${({ theme }) =>
      `${theme.spacing(1.5)} ${theme.spacing(1.5)} ${theme.spacing(1.5)} ${theme.spacing(4)}`};
  }
`;

const Author = styled('div')`
  font-size: ${fluidTypography(8, 22)};
`;

export const Avatar = styled(Image)`
  position: absolute;
  border-radius: 50%;
  width: ${({ theme }) => theme.spacing(9)};
  height: ${({ theme }) => theme.spacing(9)};
  object-fit: cover;
  left: -56px;
  top: -14px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: ${({ theme }) => theme.spacing(18)};
    height: ${({ theme }) => theme.spacing(18)};
    left: -130px;
    top: -48px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    width: ${({ theme }) => theme.spacing(24)};
    height: ${({ theme }) => theme.spacing(24)};
    left: -182px;
    top: -66px;
  }
`;

const HideOnMobile = styled('span')`
  display: none;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    display: inline;
  }
`;

export const BaselBriefing = ({ teasers, blockStyle }: BaselBriefingProps) => {
  let showFrom = undefined;
  let showUntil = undefined;
  let scheduledDate;

  const teaser = teasers && teasers[0];
  teaser?.properties?.forEach(prop => {
    if (prop.key === 'showFrom') {
      showFrom = prop.value;
    }

    if (prop.key === 'showUntil') {
      showUntil = prop.value;
    }

    if (prop.key === 'scheduledDate') {
      scheduledDate = new Date(prop.value);
    }
  });

  if (!isWithinTimeslot(showFrom, showUntil, scheduledDate)) {
    return null;
  }

  if (!teaser) {
    return null;
  }

  const { image, lead, title, contentUrl } = teaser;
  const values = getValuesBasedOnBriefing(blockStyle as BriefingType);

  if (!lead || !title || !contentUrl || !image || !values) {
    return null;
  }

  const briefingDynamicValues = {
    authorAvatar: image,
    authorName: lead,
    briefingContent: title,
    contentUrl: contentUrl || '',
  };

  return (
    <BaselBriefingStyled>
      <LinkWrapper
        color="inherit"
        underline="none"
        href={briefingDynamicValues.contentUrl}
        target={'_blank'}
      >
        <BriefingContainer>
          {values.backgroundImage && (
            <TeaserBackground image={values.backgroundImage} />
          )}

          <Heading>
            <BaselBriefingTitle>{values.title}</BaselBriefingTitle>
            <BaselBriefingSubtitle>{values.subtitle}</BaselBriefingSubtitle>
          </Heading>

          <BriefingTextWrapper>
            <Briefing>
              <Welcome>{values.welcome}</Welcome>
              <BriefingText>
                {briefingDynamicValues.briefingContent}
              </BriefingText>
            </Briefing>
          </BriefingTextWrapper>
        </BriefingContainer>
      </LinkWrapper>

      <TeaserContentWrapper>
        <TeaserContentStyled>
          <TeaserContentInterior>
            {briefingDynamicValues.authorAvatar && (
              <Avatar
                image={briefingDynamicValues.authorAvatar}
                square
              />
            )}

            {briefingDynamicValues.authorName && (
              <Author>
                Heute von <br />
                {briefingDynamicValues.authorName}
              </Author>
            )}

            <ButtonRow>
              <LinkWrapper
                color="inherit"
                underline="none"
                href={briefingDynamicValues.contentUrl}
                target={'_blank'}
              >
                <ReadMoreButton
                  variant="outlined"
                  color="inherit"
                  size="small"
                >
                  <HideOnMobile>Briefing&nbsp;</HideOnMobile>lesen
                </ReadMoreButton>
              </LinkWrapper>
            </ButtonRow>
          </TeaserContentInterior>
        </TeaserContentStyled>
      </TeaserContentWrapper>
    </BaselBriefingStyled>
  );
};
