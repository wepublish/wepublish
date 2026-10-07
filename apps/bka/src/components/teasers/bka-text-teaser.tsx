import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps, Link } from '@wepublish/website/builder';
import { format } from 'date-fns';

import { BkaTag, BkaTagList } from '../tag/bka-tag';
import { selectBkaTeaserTags } from './bka-teaser-selectors';

export const formatBkaTeaserDate = (date: Date) => format(date, 'd.M.yyyy');

export const BkaTextTeaserWrapper = styled('article')`
  position: relative;
  display: grid;
  align-content: start;

  &::before {
    content: '';
    position: absolute;
    inset: -10px;
    z-index: -1;
    border-radius: 4px;
    background-color: ${({ theme }) => theme.palette.grey[100]};
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  &:hover::before,
  &:focus-within::before {
    opacity: 1;
  }
`;

export const BkaTextTeaserMeta = styled('div')`
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-bottom: 7.5px;
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
  border-bottom: 1.5px solid currentColor;
  ${({ theme }) => css(theme.typography.teaserMeta)}
  color: inherit;
`;

export const BkaTextTeaserDate = styled('time')`
  white-space: nowrap;
`;

export const BkaTextTeaserSeparator = styled('span')`
  align-self: stretch;
  width: 6px;
  border-left: 1.5px solid currentColor;
  transform: rotate(15deg);
`;

export const BkaTextTeaserAuthors = styled('span')`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BkaTextTeaserTitle = styled('h2')`
  ${({ theme }) => css(theme.typography.teaserTitle)}
  margin: 0 0 ${({ theme }) => theme.spacing(1)};
`;

export const BkaTextTeaserLink = styled(Link)`
  display: grid;
  align-content: start;
  color: inherit;
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: none;
  }
`;

export const BkaTextTeaser = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const date = teaser && selectTeaserDate(teaser);
  const authors = (teaser && selectTeaserAuthors(teaser)) ?? [];
  const tags = selectBkaTeaserTags(teaser);

  return (
    <BkaTextTeaserWrapper className={className}>
      <BkaTextTeaserLink href={href}>
        <BkaTextTeaserMeta>
          {date && (
            <BkaTextTeaserDate dateTime={date}>
              {formatBkaTeaserDate(new Date(date))}
            </BkaTextTeaserDate>
          )}

          {!!authors.length && (
            <>
              <BkaTextTeaserSeparator aria-hidden />
              <BkaTextTeaserAuthors>{authors.join(', ')}</BkaTextTeaserAuthors>
            </>
          )}
        </BkaTextTeaserMeta>

        <BkaTextTeaserTitle>{title}</BkaTextTeaserTitle>

        {!!tags.length && (
          <BkaTagList>
            {tags.map(tag => (
              <BkaTag
                key={tag.id}
                tag={tag}
              />
            ))}
          </BkaTagList>
        )}
      </BkaTextTeaserLink>
    </BkaTextTeaserWrapper>
  );
};
