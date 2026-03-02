import { css } from '@emotion/react';
import { useTheme } from '@emotion/react';
import { BlockRenderer } from '@wepublish/block-content/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import { isFlexBlockHero } from './block-layouts/flex-block-hero';
import { MainSpacer } from './main-spacer';
export const ReflektBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      cond([
        [
          isFlexBlockHero,
          () => css`
            background-color: blue;
            grid-template-columns: auto !important;
            padding: 0 !important;
          `,
        ],
      ]),
    [theme]
  );

  const articlesStyles = useMemo(
    () =>
      cond([
        [
          () => true,
          () => css`
            background-color: green;
            grid-template-columns: repeat(12, 1fr) !important;
            padding: 0 !important;
          `,
        ],
      ]),
    []
  );

  if (props.type === 'Page') {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
      >
        <BlockRenderer {...props} />
      </MainSpacer>
    );
  }

  if (props.type === 'Article') {
    return <BlockRenderer {...props} />;
  }

  return <BlockRenderer {...props} />;
};
