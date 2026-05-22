import styled from '@emotion/styled';
import { BlockRenderer } from '@wepublish/block-content/website';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';

import { eenewsColors } from '../../theme';

const Band = styled('section')`
  background: ${eenewsColors.tag};
  border-bottom: 1.5px solid ${eenewsColors.accent};
  padding: 48px 56px 40px;

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 32px 20px 24px;
  }
`;

const Inner = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
`;

export const EenewsSectionBand = ({
  blocks,
  className,
}: BuilderFlexBlockProps) => {
  const wrapped = blocks ?? [];
  return (
    <Band className={className}>
      <Inner>
        {wrapped.map((item, idx) => {
          if (!item.block) {
            return null;
          }
          return (
            <BlockRenderer
              key={idx}
              block={item.block}
              count={wrapped.length}
              index={idx}
              type="Page"
            />
          );
        })}
      </Inner>
    </Band>
  );
};
