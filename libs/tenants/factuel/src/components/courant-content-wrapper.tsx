import styled from '@emotion/styled';
import {
  EventBlockWrapper,
  FlexBlockWrapper,
  ListicleBlockWrapper,
  TeaserAuthors,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockTeasers,
  TeaserSlotsBlockTeasers,
} from '@wepublish/block-content/website';
import { ContentWrapperStyled } from '@wepublish/content/website';
import { BuilderContentWrapperProps } from '@wepublish/website/builder';
import { useRouter } from 'next/router';

import { courantTokens } from '../brand-tokens';

const { pageGap, columnGap, articleGap, blockGaps } = courantTokens.layout;
const { warmGray } = courantTokens.colors;

export const CourantContentFullWidth = styled.div`
  display: grid;
  row-gap: var(--page-content-row-gap);
`;

const CourantContentWrapperStyled = styled(ContentWrapperStyled)`
  display: grid;
  row-gap: var(--page-content-row-gap);

  --page-content-row-gap: ${({ theme }) => theme.spacing(pageGap.xs)};
  --article-content-row-gap: ${({ theme }) => theme.spacing(articleGap)};
  --content-column-gap: ${({ theme }) => theme.spacing(columnGap.xs)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(pageGap.md)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(pageGap.lg)};
    --content-column-gap: ${({ theme }) => theme.spacing(columnGap.lg)};
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(pageGap.xl)};
    --content-column-gap: ${({ theme }) => theme.spacing(columnGap.xl)};
  }

  ${TeaserGridBlockWrapper},
  ${TeaserGridFlexBlockWrapper},
  ${TeaserListBlockTeasers},
  ${TeaserSlotsBlockTeasers} {
    column-gap: ${({ theme }) => theme.spacing(blockGaps.teaserColumn)};
    row-gap: ${({ theme }) => theme.spacing(blockGaps.teaserRow)};
  }

  ${FlexBlockWrapper} {
    column-gap: ${({ theme }) => theme.spacing(blockGaps.flexColumn)};
    row-gap: ${({ theme }) => theme.spacing(blockGaps.flexRow)};
  }

  ${ListicleBlockWrapper} {
    gap: ${({ theme }) => theme.spacing(blockGaps.listicleItem)};
  }

  ${EventBlockWrapper} {
    gap: ${({ theme }) => theme.spacing(blockGaps.event)};
  }

  ${TeaserAuthors} {
    font-family: var(--courant-captions);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.065em;
    color: ${warmGray[700]};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    & > * {
      grid-column: 3/11;
    }
  }
`;

const CourantArticleContentWrapperStyled = styled(CourantContentWrapperStyled)`
  ${({ theme }) => theme.breakpoints.up('lg')} {
    & > * {
      grid-column: 4/10;
    }
  }
`;

export const CourantContentWrapper = (props: BuilderContentWrapperProps) => {
  const router = useRouter();
  const isArticle = router.pathname.startsWith('/a/');
  const Wrapper =
    isArticle ?
      CourantArticleContentWrapperStyled
    : CourantContentWrapperStyled;
  return <Wrapper {...props} />;
};
