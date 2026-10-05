import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps, Image, Link } from '@wepublish/website/builder';
import { format } from 'date-fns';

export const formatBkaCaptionDate = (date: Date) => format(date, 'dd.MM.yyyy');

export const BkaImageTeaserImage = styled(Image)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
  transition:
    transform 1s cubic-bezier(0.165, 0.84, 0.44, 1),
    filter 1s cubic-bezier(0.165, 0.84, 0.44, 1);
`;

export const BkaImageTeaserTitles = styled('div')`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: calc(100% - 20px);
`;

export const BkaImageTeaserCaption = styled('span')`
  display: inline-block;
  padding: 0 5px 0 2px;
  background-color: ${({ theme }) => theme.palette.background.default};
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-style: italic;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};
`;

export const BkaImageTeaserTitle = styled('h2')`
  display: inline-block;
  margin: 0;
  padding: 0 5px 0 2px;
  background-color: ${({ theme }) => theme.palette.background.default};
  color: ${({ theme }) => theme.palette.text.primary};
  ${({ theme }) => css(theme.typography.teaserTitle)}
`;

export const BkaImageTeaserWrapper = styled(Link)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  border-radius: 4px;
  height: 250px;
  background-color: #fefefe;
  color: ${({ theme }) => theme.palette.text.primary};
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: none;
  }

  &:hover ${BkaImageTeaserImage}, &:focus ${BkaImageTeaserImage} {
    filter: brightness(0.8);
    transform: scale(1.05);
  }
`;

export const BkaImageTeaser = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const image = teaser && selectTeaserImage(teaser);
  const date = teaser && selectTeaserDate(teaser);
  const authors = (teaser && selectTeaserAuthors(teaser)) ?? [];

  const caption = [date && formatBkaCaptionDate(new Date(date)), ...authors]
    .filter(Boolean)
    .join(' ');

  return (
    <BkaImageTeaserWrapper
      className={className}
      href={href}
    >
      {image && <BkaImageTeaserImage image={image} />}

      <BkaImageTeaserTitles>
        {!!caption && <BkaImageTeaserCaption>{caption}</BkaImageTeaserCaption>}
        <BkaImageTeaserTitle>{title}</BkaImageTeaserTitle>
      </BkaImageTeaserTitles>
    </BkaImageTeaserWrapper>
  );
};
