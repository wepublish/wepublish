import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { BuilderQuoteBlockProps, Image } from '@wepublish/website/builder';

import { designText } from '../theme';

/** "Jan Amsler, Co-Chefredaktor OnlineReports" → name and role */
export const splitAuthor = (author: string | null | undefined) => {
  const [name, ...role] = (author ?? '').split(',');

  return { name: name.trim(), role: role.join(',').trim() };
};

export const QuoteWrapper = styled('figure')`
  display: grid;
  gap: 40px;
  margin: 0;
`;

export const QuoteText = styled('blockquote')`
  margin: 0;

  p {
    ${designText.h3 as CSSObject}
    margin: 0;
    quotes: '«' '»';

    &::before {
      content: open-quote;
    }

    &::after {
      content: close-quote;
    }
  }
`;

export const QuoteAuthor = styled('figcaption')`
  display: flex;
  align-items: center;
  gap: 30px;
`;

export const QuotePortrait = styled(Image)`
  flex-shrink: 0;
  width: 120px;
  aspect-ratio: 181 / 217;
  object-fit: cover;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 181px;
  }
`;

export const QuoteName = styled('p')`
  ${designText.h3 as CSSObject}
  margin: 0;
`;

export const QuoteRole = styled('p')`
  ${designText.textSmallMono as CSSObject}
  margin: 0;
`;

/**
 * The quote above the author: a portrait (optional) next to the name and the
 * role, which the editor writes after a comma in the author field.
 */
export const WepQuoteBlock = ({
  className,
  quote,
  author,
  image,
}: BuilderQuoteBlockProps) => {
  const { name, role } = splitAuthor(author);

  return (
    <QuoteWrapper className={className}>
      {quote && (
        <QuoteText>
          <p>{quote}</p>
        </QuoteText>
      )}

      {(name || image) && (
        <QuoteAuthor>
          {image && <QuotePortrait image={image} />}

          <div>
            {name && <QuoteName>{name}</QuoteName>}
            {role && <QuoteRole>{role}</QuoteRole>}
          </div>
        </QuoteAuthor>
      )}
    </QuoteWrapper>
  );
};
