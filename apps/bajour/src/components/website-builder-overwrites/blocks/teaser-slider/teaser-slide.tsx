import styled from '@emotion/styled';
import { css, Theme } from '@mui/material';
import {
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { fluidTypography } from '../teaser-overwrite.style';

export const TeaserSlideContainer = styled('div')`
  display: grid;
  grid-auto-rows: max-content;
  background-color: ${({ theme }) => theme.palette.common.white};
  height: 100%;
  align-items: start;
`;

export const TeaserSlideContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(3)};
  padding-top: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('xl')} {
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const imageStyles = css`
  aspect-ratio: 16/9;
  width: 100%;
  object-fit: cover;
`;

const metaStyles = css`
  font-size: ${fluidTypography(8, 19)};
  font-style: italic;
  font-weight: 300;
`;

const titleStyles = css`
  font-size: ${fluidTypography(13, 38)};
  font-weight: bold;
`;

const leadStyles = css`
  font-size: ${fluidTypography(11, 24)};
  font-weight: 300;
`;

const buttonStyles = (theme: Theme) => css`
  margin-top: ${theme.spacing(2)};
  justify-self: end;

  ${theme.breakpoints.up('xl')} {
    margin-top: ${theme.spacing(4)};
  }
`;

export const TeaserSlide = ({
  teaser,
  className,
}: Omit<BuilderTeaserProps, 'alignment'>) => {
  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const image = teaser && selectTeaserImage(teaser);
  const publishDate = teaser && selectTeaserDate(teaser);
  const authors = teaser && selectTeaserAuthors(teaser);

  const {
    elements: { Image, H5, Paragraph, Button, Link },
    date,
  } = useWebsiteBuilder();

  return (
    <TeaserSlideContainer className={className}>
      {image && (
        <Image
          image={image}
          css={imageStyles}
        />
      )}

      <TeaserSlideContent>
        <Paragraph
          css={metaStyles}
          gutterBottom={false}
        >
          {authors?.join(',')}{' '}
          {publishDate && <>am {date.format(new Date(publishDate), false)}</>}
        </Paragraph>

        <H5 css={titleStyles}>{title}</H5>
        <Paragraph
          css={leadStyles}
          gutterBottom={false}
        >
          {lead}
        </Paragraph>

        <Button
          LinkComponent={Link}
          href={href}
          variant="outlined"
          color="primary"
          css={buttonStyles}
        >
          Weiterlesen
        </Button>
      </TeaserSlideContent>
    </TeaserSlideContainer>
  );
};
