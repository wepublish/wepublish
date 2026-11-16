import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from '@wepublish/website/builder';
import { ReactNode, useId } from 'react';

import { designText } from '../../theme';

// Entries without image below each other, separated by grey lines
export const PlainList = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`;

export const PlainListItem = styled('article')`
  & + & {
    border-top: 1px solid #888888;
    margin-top: 25px;
    padding-top: 25px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin-top: 35px;
      padding-top: 35px;
    }
  }

  a,
  a:hover {
    display: grid;
    gap: 15px;
    color: inherit;
    text-decoration: none;
  }
`;

export const PlainListTitle = styled('h3')`
  ${designText.h4 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const PlainListDetails = styled('p')`
  ${designText.text as CSSObject}
  display: flex;
  flex-wrap: wrap;
  gap: 0 20px;
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.dark};
`;

/** An entry of a plain list: its title and details (e.g. date and place) below */
export const PlainListEntry = ({
  href,
  target,
  title,
  details,
}: {
  href?: string | null;
  target?: string;
  title?: string | null;
  details: Array<ReactNode | null | undefined>;
}) => {
  const titleId = useId();
  const shownDetails = details.filter(Boolean);

  return (
    <PlainListItem aria-labelledby={titleId}>
      <Link
        href={href ?? undefined}
        target={target}
      >
        <PlainListTitle id={titleId}>{title}</PlainListTitle>

        {shownDetails.length > 0 && (
          <PlainListDetails>
            {shownDetails.map((detail, index) => (
              <span key={index}>{detail}</span>
            ))}
          </PlainListDetails>
        )}
      </Link>
    </PlainListItem>
  );
};
