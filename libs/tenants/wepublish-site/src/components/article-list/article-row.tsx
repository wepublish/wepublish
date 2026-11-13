import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { joinAuthorNames } from '@wepublish/block-content/website';
import { BuilderImageProps, Image, Link } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import { formatListDate } from '../format-list-date';

export type ArticleRowProps = {
  href?: string | null;
  target?: string | null;
  image?: BuilderImageProps['image'] | null;
  title?: string | null;
  lead?: string | null;
  authors?: string[] | null;
  date?: string | null;
};

export const ArticleRowWrapper = styled('article')`
  a,
  a:hover {
    display: grid;
    // Never wider than the screen, even while the image is missing
    grid-template-columns: minmax(0, 1fr);
    gap: ${({ theme }) => theme.spacing(2)};
    color: inherit;
    text-decoration: none;

    // The image on the left, the text over the whole width without one
    ${({ theme }) => theme.breakpoints.up('sm')} {
      &:has(img) {
        grid-template-columns: minmax(0, 488fr) minmax(0, 752fr);
        align-items: center;
        gap: 30px;
      }
    }
  }
`;

export const ArticleRowImage = styled(Image)`
  width: 100%;
  aspect-ratio: 488 / 330;
  object-fit: cover;
`;

export const ArticleRowText = styled('div')`
  display: grid;
  gap: 15px;
`;

export const ArticleRowTitle = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const ArticleRowLead = styled('p')`
  ${designText.text as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const ArticleRowMeta = styled('p')`
  ${designText.textSmallMono as CSSObject}
  margin: 0;
  color: #888888;
  hyphens: manual;
`;

/**
 * An article in a list: the image on the left, the title, the lead and
 * "von <authors>, <date>" on the right.
 */
export const ArticleRow = ({
  href,
  target,
  image,
  title,
  lead,
  authors,
  date,
}: ArticleRowProps) => {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const titleId = useId();

  const byline =
    authors?.length ?
      `${t('articleList.by')} ${joinAuthorNames(authors, ', ', ', ')}`
    : undefined;
  const meta = [byline, date && formatListDate(date, locale)]
    .filter(Boolean)
    .join(', ');

  return (
    <ArticleRowWrapper aria-labelledby={titleId}>
      <Link
        href={href ?? undefined}
        target={target ?? undefined}
      >
        {image && <ArticleRowImage image={image} />}

        <ArticleRowText>
          <ArticleRowTitle id={titleId}>{title}</ArticleRowTitle>
          {lead && <ArticleRowLead>{lead}</ArticleRowLead>}
          {meta && <ArticleRowMeta>{meta}</ArticleRowMeta>}
        </ArticleRowText>
      </Link>
    </ArticleRowWrapper>
  );
};

export const ArticleRows = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(6)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: 75px;
  }
`;
