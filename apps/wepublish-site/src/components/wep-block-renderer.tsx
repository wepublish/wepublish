import { css, Theme } from '@emotion/react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  BlockRenderer,
  collectSiblings,
  isImageBlock,
  isRichTextBlock,
} from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { anyPass, cond } from 'ramda';
import { memo, useMemo } from 'react';

import {
  AttentionCatcher,
  isAttentionCatcher,
} from './break-blocks/attention-catcher';
import { MainSpacer } from './wep-main-spacer';

export const WepBlockRenderer = (props: BuilderBlockRendererProps) => {
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isAttentionCatcher,
          (block: BuilderBreakBlockProps) => (
            <AttentionCatcher
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
      ]) as (block: BlockContent) => JSX.Element | undefined,
    [props.siblings]
  );

  const styles = useMemo(
    () =>
      cond([
        [
          anyPass([isImageBlock, isRichTextBlock]),
          () => css`
            grid-template-columns:
              max(calc(100vw - var(--breakpoint-width)) / 2, 0px)
              repeat(12, 1fr) max(
                calc(100vw - var(--breakpoint-width)) / 2,
                0px
              ) !important;
            //grid-template-columns: subgrid !important;
            & > * {
              /*
              grid-column: 3/14;
              margin-left: 0;
              margin-right: 0;
              */
            }
          `,
        ],
      ]),
    [isMobile]
  );

  if (props.type === 'Page') {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
      >
        {extraBlockMap(props.block) ?? (
          <BlockRenderer
            {...props}
            siblings={props.siblings}
          />
        )}
      </MainSpacer>
    );
  }

  return (
    extraBlockMap(props.block) ?? (
      <BlockRenderer
        {...props}
        siblings={props.siblings}
      />
    )
  );
};

// eslint-disable-next-line react/display-name
export const WepBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const siblings = collectSiblings(blocks);

  return (
    <>
      {blocks.map((block, index) => (
        <ImageContext.Provider
          key={index}
          value={
            // Above the fold images should be loaded with a high priority
            3 > index ?
              {
                fetchPriority: 'high',
                loading: 'eager',
              }
            : {}
          }
        >
          <Renderer
            block={block}
            index={index}
            count={blocks.length}
            siblings={siblings}
            type={type}
          />
        </ImageContext.Provider>
      ))}
    </>
  );
});
