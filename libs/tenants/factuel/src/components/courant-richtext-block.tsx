import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';
import { useIsArticleBody } from './courant-article-body.context';

const { article: articleHeadings } = courantTokens.typography.headings;

const EditorialRichTextBlock = styled(RichTextBlock)`
  &,
  & .MuiTypography-body1,
  & .MuiTypography-body2,
  & blockquote,
  & table {
    font-family: var(--courant-editorial);
    font-weight: var(--courant-editorial-weight);
    line-height: 1.4;
    letter-spacing: 0.01em;
  }

  & strong,
  & b {
    font-weight: 500;
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
`;

export const CourantRichTextBlock = (props: BuilderRichTextBlockProps) => {
  const inArticleBody = useIsArticleBody();
  const Component = inArticleBody ? EditorialRichTextBlock : RichTextBlock;

  return <Component {...props} />;
};
