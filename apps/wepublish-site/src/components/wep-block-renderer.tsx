import { css, useTheme } from '@emotion/react';
import { BlockRenderer } from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import { FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { anyPass, cond } from 'ramda';
import { JSX, memo, useMemo } from 'react';

import {
  AttentionCatcher,
  isAttentionCatcher,
} from './break-blocks/attention-catcher';
import { MainSpacer } from './wep-main-spacer';

export const WepBlockRenderer = (props: BuilderBlockRendererProps) => {
  const { asPath } = useRouter();
  const isHomePage = asPath === '/' || asPath === '/de' || asPath === '/fr';
  const theme = useTheme();

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isAttentionCatcher,
          (block: BuilderBreakBlockProps) => <AttentionCatcher {...block} />,
        ],
      ]) as (block: FullBlockFragment) => JSX.Element | undefined,
    []
  );

  const styles = useMemo(
    () =>
      cond([
        [
          anyPass([block => true]),
          () =>
            isHomePage && props.index < 2 ?
              css``
            : css`
                ${theme.breakpoints.up('md')} {
                  grid-template-columns: minmax(
                    auto,
                    calc(
                      ${theme.breakpoints.values['lg']}px - ${theme.spacing(16)}
                    )
                  ) !important;
                }
              `,
        ],
      ]),
    [isHomePage, props.index, theme]
  );

  if (props.type === 'Page') {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
      >
        {extraBlockMap(props.block) ?? <BlockRenderer {...props} />}
      </MainSpacer>
    );
  }

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />;
};

// eslint-disable-next-line react/display-name
export const WepBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

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
            type={type}
          />
        </ImageContext.Provider>
      ))}
    </>
  );
});
