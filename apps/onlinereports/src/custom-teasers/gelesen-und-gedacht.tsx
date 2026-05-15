import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import {
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle,
  TeaserWrapper,
} from '@wepublish/block-content/website';
import { ArticleTeaser } from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useMemo } from 'react';

import { BlueBox } from '../components/blue-box';

export const isGelesenUndGedachtTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.__typename === 'ArticleTeaser',
  ({ teaser }: BuilderTeaserProps) =>
    !!(teaser as ArticleTeaser).article?.tags
      .map(t => t.tag)
      .includes('Gelesen & gedacht'),
]);

export const GelesenUndGedachtTeaser = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
  return (
    <TeaserWrapper {...alignment}>
      <BlueBox>
        <GelesenUndGedachtTeaserContent
          teaser={teaser}
          className={className}
        />
      </BlueBox>
    </TeaserWrapper>
  );
};

const GelesenUndGedachtUnstyled = ({
  teaser,
  className,
}: Pick<BuilderTeaserProps, 'className' | 'teaser'>) => {
  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const image = teaser && selectTeaserImage(teaser);
  const {
    elements: { Image },
  } = useWebsiteBuilder();

  const [gelesen, source, gedacht] = useMemo(() => {
    return [title, ...(lead?.split(/\n+/, 2) ?? [])];
  }, [title, lead]);

  return (
    <Box className={className}>
      <Gelesen>
        <Box>{image ? 'Gesehen ...' : 'Gelesen ...'}</Box>
        {image ?
          <GesehenBild>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image image={image} />
          </GesehenBild>
        : <GelesenQuote variant={'subtitle2'}>{gelesen}</GelesenQuote>}
        <GelesenSource>{source}</GelesenSource>
      </Gelesen>

      <Gedacht>
        <Box>... und dabei gedacht</Box>
        <GedachtText variant={'subtitle2'}>{gedacht}</GedachtText>
      </Gedacht>
    </Box>
  );
};

export const GelesenUndGedachtTeaserContent = styled(GelesenUndGedachtUnstyled)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};

  color: ${({ theme }) => theme.palette.text.primary};
  text-decoration: none;
  font-size: 18px;
`;

const Gelesen = styled(Box)`
  max-width: 500px;
  display: flex;
  flex-direction: column;
`;

const GelesenQuote = styled(Typography)`
  font-size: 28px;
  font-weight: 600;
`;

const GesehenBild = styled('div')`
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const GelesenSource = styled('div')`
  font-size: 14px;
`;

const Gedacht = styled(Gelesen)`
  align-self: end;
`;

const GedachtText = styled(Typography)`
  font-size: 28px;
  font-weight: 600;
`;
