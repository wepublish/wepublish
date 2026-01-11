import { BlockRenderer } from '@wepublish/block-content/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import { IsSidebarContent, SidebarContent } from './sidebar-content';

export const TsriBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          IsSidebarContent,
          block => (
            <SidebarContent
              {...block}
              count={props.count}
              index={props.index}
            />
          ),
        ],
      ]),
    []
  );

  const block = extraBlockMap(props.block) ?? <BlockRenderer {...props} />;

  if (props.type === 'Page') {
    return block;
  }

  return <>{block}</>;
};
