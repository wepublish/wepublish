import styled from '@emotion/styled';
import { BlockRenderer } from '@wepublish/block-content/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';

const Band = styled('section')`
  background: ${({ theme }) => theme.palette.secondary.main};
  border-bottom: 1.5px solid ${({ theme }) => theme.palette.primary.main};
  padding: 48px 56px 40px;

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 32px 20px 24px;
  }
`;

const Inner = styled('div')`
  max-width: var(--max-width);
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
              block={item.block as FullBlockFragment}
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
