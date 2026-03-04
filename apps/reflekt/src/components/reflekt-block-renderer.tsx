import { css } from '@emotion/react';
import { useTheme } from '@emotion/react';
import { BlockRenderer } from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { cond } from 'ramda';
import type { ComponentType } from 'react';
import { memo, useMemo } from 'react';

import { isFlexBlockHero } from './block-layouts/flex-block-hero';
import {
  isCollapsibleRichText,
  ReflektCollapsibleRichText,
} from './block-styles/reflekt-collapsible-richtext';
import { MainSpacer } from './main-spacer';

export type BlockSiblings = Array<{
  typeName: string;
  blockStyle?: string;
}>;

export const ReflektBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme();

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isCollapsibleRichText,
          block => (
            <ReflektCollapsibleRichText
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
      ]),
    []
  );

  const styles = useMemo(
    () =>
      cond([
        [
          isFlexBlockHero,
          () => css`
            grid-template-columns: auto !important;
            padding: 0 !important;
          `,
        ],
      ]),
    [theme]
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
export const ReflektBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder() as {
    blocks: {
      Renderer: ComponentType<
        BuilderBlockRendererProps & { siblings: BlockSiblings }
      >;
    };
  };

  const siblings = blocks.map(b => ({
    typeName: b.__typename,
    blockStyle: b.blockStyle,
  })) as BlockSiblings;

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
            block={
              { ...block, siblings } as BlockContent & {
                siblings: BlockSiblings;
              }
            }
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
