import styled from '@emotion/styled';
import {
  BlockContent,
  IFrameBlock as IFrameBlockType,
} from '@wepublish/website/api';
import { BuilderIFrameBlockProps } from '@wepublish/website/builder';
import { css } from '@emotion/react';
import { useMemo } from 'react';
import IframeResizer from 'iframe-resizer-react';

export const isIFrameBlock = (
  block: Pick<BlockContent, '__typename'>
): block is IFrameBlockType => block.__typename === 'IFrameBlock';

export const IFrameBlockWrapper = styled('div')``;

export const IFrameBlockIframe = styled(IframeResizer as any)`
  width: 100%;
  border: 0;
`;

export function IFrameBlock({
  url,
  title,
  width,
  height,
  styleCustom,
  sandbox,
  className,
}: BuilderIFrameBlockProps) {
  const styleCustomCss = useMemo(
    () => css`
      ${styleCustom}
    `,
    [styleCustom]
  );

  return url ?
      <IFrameBlockWrapper className={className}>
        <IFrameBlockIframe
          css={styleCustomCss}
          src={url}
          title={title ?? undefined}
          allowFullScreen
          width={width?.toString()}
          height={height?.toString()}
          sandbox={sandbox || undefined}
        />
      </IFrameBlockWrapper>
    : <div></div>;
}
