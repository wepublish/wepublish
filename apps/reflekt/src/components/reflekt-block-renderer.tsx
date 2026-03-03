import { css } from '@emotion/react';
import { useTheme } from '@emotion/react';
import { BlockRenderer } from '@wepublish/block-content/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import { isFlexBlockHero } from './block-layouts/flex-block-hero';
import {
  isCollapsibleRichText,
  ReflektCollapsibleRichText,
} from './block-styles/reflekt-collapsible-richtext';
import { MainSpacer } from './main-spacer';
export const ReflektBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme();

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isCollapsibleRichText,
          block => <ReflektCollapsibleRichText {...block} />,
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
        {extraBlockMap(props.block) ?? <BlockRenderer {...props} />}
      </MainSpacer>
    );
  }

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />;
};
