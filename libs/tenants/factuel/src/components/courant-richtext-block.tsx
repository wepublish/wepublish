import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';
import { css } from '@emotion/react';

import { courantTokens } from '../brand-tokens';
import { useIsArticleBody } from './courant-article-body.context';

const { article: articleHeadings, richtext: richtextHeadings } =
  courantTokens.typography.headings;
const { editorialBody } = courantTokens.typography.sizes;

const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const headingSpacingCss = (spacing: (typeof articleHeadings)['spacing']) => css`
  ${headingLevels
    .map(
      l => `
        & .MuiTypography-${l} {
          margin-top: ${spacing[l].top};
          margin-bottom: ${spacing[l].bottom};
        }
      `
    )
    .join('\n')}

  & > :is(h1, h2, h3, h4, h5, h6):first-child {
    margin-top: 0;
  }
`;

const EditorialRichTextBlock = styled(RichTextBlock)`
  &,
  & .MuiTypography-body1,
  & .MuiTypography-body2,
  & blockquote,
  & table {
    font-family: var(--courant-editorial);
    font-weight: var(--courant-editorial-weight);
    font-size: ${editorialBody};
    line-height: 1.4;
    letter-spacing: 0.01em;
    hyphens: auto;
    text-wrap: auto;
  }

  & strong,
  & b {
    font-weight: 600;
  }

  & h1,
  & .MuiTypography-h1 {
    font-size: ${articleHeadings.h1};
  }
  & h2,
  & .MuiTypography-h2 {
    font-size: ${articleHeadings.h2};
  }
  & h3,
  & .MuiTypography-h3 {
    font-size: ${articleHeadings.h3};
  }
  & h4,
  & .MuiTypography-h4 {
    font-size: ${articleHeadings.h4};
  }
  & h5,
  & .MuiTypography-h5 {
    font-size: ${articleHeadings.h5};
  }
  & h6,
  & .MuiTypography-h6 {
    font-size: ${articleHeadings.h6};
  }

  ${headingSpacingCss(articleHeadings.spacing)}
`;

const PageRichTextBlock = styled(RichTextBlock)`
  &
    :is(
      .MuiTypography-h3,
      .MuiTypography-h4,
      .MuiTypography-h5,
      .MuiTypography-h6
    ) {
    font-family: ${richtextHeadings.face.fontFamily};
    font-weight: ${richtextHeadings.face.fontWeight};
    line-height: ${richtextHeadings.face.lineHeight};
    letter-spacing: ${richtextHeadings.face.letterSpacing};
  }
  & .MuiTypography-h3 {
    font-size: ${richtextHeadings.h3};
  }
  & .MuiTypography-h4 {
    font-size: ${richtextHeadings.h4};
  }
  & .MuiTypography-h5 {
    font-size: ${richtextHeadings.h5};
  }
  & .MuiTypography-h6 {
    font-size: ${richtextHeadings.h6};
  }

  ${headingSpacingCss(richtextHeadings.spacing)}
`;

export const CourantRichTextBlock = (props: BuilderRichTextBlockProps) => {
  const inArticleBody = useIsArticleBody();
  const Component = inArticleBody ? EditorialRichTextBlock : PageRichTextBlock;

  return <Component {...props} />;
};
