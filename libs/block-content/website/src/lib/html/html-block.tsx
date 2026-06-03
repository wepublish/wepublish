import styled from '@emotion/styled';
import { BuilderHTMLBlockProps } from '@wepublish/website/builder';
import { BlockContent, FullHtmlBlockFragment } from '@wepublish/website/api';
import InnerHTML from 'dangerously-set-html-content';

export const isHtmlBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullHtmlBlockFragment => block.__typename === 'HTMLBlock';

export const HtmlBlockWrapper = styled('div')``;

export const HtmlBlock = ({ html, className }: BuilderHTMLBlockProps) => (
  <HtmlBlockWrapper className={className}>
    {html && (
      <InnerHTML
        key={html}
        html={html}
      />
    )}
  </HtmlBlockWrapper>
);
