import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  selectTeaserAuthors,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { useStatsQuery } from '@wepublish/website/api';
import {
  BuilderTeaserGridBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { differenceInYears } from 'date-fns';
import { useState } from 'react';

import { ReactComponent as Logo } from '../../logo.svg';
import { ArchiveSlider } from './archive-slider';

export const ArchiveWrapper = styled('div')``;

const StatsWrapper = styled('div')`
  margin: ${({ theme }) => theme.spacing(4)} 0;
  padding: 0 ${({ theme }) => theme.spacing(2)};
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: auto;
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`;

const BestOfBajour = styled('div')`
  text-transform: uppercase;
  display: flex;
  align-items: center;
  font-size: 13px;
  grid-column: 1/6;
  grid-row: 1/2;
  justify-content: center;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 1/7;
    font-size: 27px;
  }
`;

const BajourLogo = styled(Logo)`
  margin: 0 ${({ theme }) => theme.spacing(1)} 0
    ${({ theme }) => theme.spacing(2)};
  width: 100px;
  height: 65px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: 0 ${({ theme }) => theme.spacing(2)} 0
      ${({ theme }) => theme.spacing(3)};
    width: 250px;
    height: 150px;
  }
`;

const ArchiveText = styled('span')`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const Timeline = styled('div')`
  position: relative;
  grid-column: 3/7;
  grid-row: 2/3;
  display: grid;
  grid-template-areas:
    'articles .'
    '. authors'
    'years .';
  grid-template-columns: 1fr 1fr;
  column-gap: ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.palette.primary.main};
  font-weight: 600;
  font-size: 10px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    column-gap: ${({ theme }) => theme.spacing(12)};
    font-size: 27px;
  }
`;

const Articles = styled('div')`
  grid-area: articles;
  text-align: right;
  display: flex;
  flex-direction: column;
`;

const Authors = styled('div')`
  grid-area: authors;
  text-align: left;
  display: flex;
  flex-direction: column;
`;

const Years = styled('div')`
  grid-area: years;
  text-align: right;
  display: flex;
  flex-direction: column;
`;

const Number = styled('span')`
  font-size: 44px;
  line-height: 1;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 100px;
  }
`;

const Axis = styled('div')`
  position: absolute;
  z-index: 10;
  top: -15%;
  left: 50%;
  transform: translateX(-50%);
  height: 135%;
  width: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.primary.main};
  border-radius: ${({ theme }) => theme.spacing(2)};
  border: 4px solid ${({ theme }) => theme.palette.common.white};

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: ${({ theme }) => theme.spacing(3)};
    border-width: 5px;
  }
`;

const CarouselWrapper = styled('div')`
  position: relative;
  width: 100%;
  top: -${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    top: 0;
  }
`;

const Highlights = styled('span')`
  position: absolute;
  top: -${({ theme }) => theme.spacing(3)};
  left: 5%;
  font-size: 13px;
  font-weight: bold;
  color: ${({ theme }) => theme.palette.primary.main};

  ${({ theme }) => theme.breakpoints.up('md')} {
    top: -${({ theme }) => theme.spacing(7)};
    font-size: 35px;
  }
`;

const CurrentTeaser = styled('div')`
  padding: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(7)};
  }
`;

const buttonStyles = css`
  justify-self: end;
`;

const Author = styled('div')`
  font-weight: 300;
  font-style: italic;
  font-size: 17px;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const Title = styled('div')`
  font-size: 20px;
  font-weight: 700;
`;

const Lead = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    max-width: 75%;
  }
`;

const LinkWrapper = styled('div')`
  display: grid;
`;

export const Archive = ({ teasers }: BuilderTeaserGridBlockProps) => {
  const { data } = useStatsQuery();
  const [currentTeaser, setCurrentTeaser] = useState(teasers[2]);

  const title = currentTeaser && selectTeaserTitle(currentTeaser);
  const lead = currentTeaser && selectTeaserLead(currentTeaser);
  const href = (currentTeaser && selectTeaserUrl(currentTeaser)) ?? '';
  const authors = currentTeaser && selectTeaserAuthors(currentTeaser);

  const {
    elements: { Link, Button },
  } = useWebsiteBuilder();

  return (
    <ArchiveWrapper>
      <StatsWrapper>
        <BestOfBajour>
          Best of
          <BajourLogo />
          <ArchiveText>Archiv</ArchiveText>
        </BestOfBajour>

        <Timeline>
          <Articles>
            <Number>{data?.stats?.articlesCount}</Number>
            Artikel
          </Articles>

          <Authors>
            <Number>{data?.stats?.authorsCount}</Number>
            AutorInnen
          </Authors>

          <Years>
            {data?.stats?.firstArticleDate && (
              <Number>
                {differenceInYears(
                  new Date(),
                  new Date(data.stats.firstArticleDate)
                ) + 1}
              </Number>
            )}
            Jahre
          </Years>

          <Axis />
        </Timeline>
      </StatsWrapper>

      <CarouselWrapper>
        <Highlights>Unsere Highlights</Highlights>
        <ArchiveSlider
          teasers={teasers}
          setTeaser={setCurrentTeaser}
        />
      </CarouselWrapper>

      <CurrentTeaser>
        <Title>{title}</Title>
        {Boolean(authors?.length) && <Author>von {authors?.join(', ')}</Author>}

        <Lead>{lead}</Lead>

        <LinkWrapper>
          <Button
            LinkComponent={Link}
            href={href}
            variant="outlined"
            color="primary"
            css={buttonStyles}
          >
            Weiterlesen
          </Button>
        </LinkWrapper>
      </CurrentTeaser>
    </ArchiveWrapper>
  );
};
