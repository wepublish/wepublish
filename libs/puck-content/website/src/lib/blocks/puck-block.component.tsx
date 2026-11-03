import { ClassNames } from '@emotion/react';
import { FullPuckBlockFragment } from '@wepublish/website/api';
import { cond } from 'ramda';
import { memo, ReactNode, useMemo } from 'react';

import { GeneratedBlock } from '../generated/generated-blocks.component';
import { puckBlockCss } from './block-css';
import { PuckBlockNode } from './block-tree';
import { PuckSlotProps, PuckSlots } from './block.types';
import {
  isGeneratedPuckBlock,
  puckBlockDefinition,
  puckBlockProps,
  usePuckBlockComponents,
} from './puck-block-registry';
import { PuckSlot } from './slots.component';
import { TeaserSlotBoundary } from './teaser-slot-boundary.component';

export type PuckBlockRendererProps = {
  node: PuckBlockNode<FullPuckBlockFragment>;
};

const puckSlotsOf = ({
  slots,
}: PuckBlockNode<FullPuckBlockFragment>): PuckSlots =>
  Object.fromEntries(
    [...slots].map(([key, children]) => [
      key,
      (slotProps: PuckSlotProps = {}) => (
        <PuckSlot {...slotProps}>
          {children.map(child => (
            <PuckBlockRenderer
              key={child.block.id}
              node={child}
            />
          ))}
        </PuckSlot>
      ),
    ])
  );

export const PuckBlockRenderer = memo(({ node }: PuckBlockRendererProps) => {
  const components = usePuckBlockComponents();
  const slots = useMemo(() => puckSlotsOf(node), [node]);
  const { block } = node;
  const definition = puckBlockDefinition(components, block);

  if (block.visibility?.disabled) {
    return null;
  }

  return (
    <ClassNames>
      {({ css, theme }) => {
        const className = css(
          puckBlockCss(theme, block, { marginSides: definition?.marginSides })
        );

        return (
          <TeaserSlotBoundary
            datasources={block.datasources}
            data={block.data}
          >
            {cond<[FullPuckBlockFragment], ReactNode>([
              [
                isGeneratedPuckBlock,
                () => (
                  <GeneratedBlock
                    node={node}
                    className={className}
                    ChildBlock={PuckBlockRenderer}
                  />
                ),
              ],
              [
                () => definition !== undefined,
                ({ id, data, styling, visibility }) =>
                  definition && (
                    <definition.component
                      id={id}
                      props={puckBlockProps(block)}
                      data={data}
                      slots={slots}
                      styling={styling}
                      visibility={visibility}
                      className={className}
                    />
                  ),
              ],
            ])(block) ?? null}
          </TeaserSlotBoundary>
        );
      }}
    </ClassNames>
  );
});
