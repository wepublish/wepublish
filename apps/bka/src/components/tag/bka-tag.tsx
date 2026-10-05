import styled from '@emotion/styled';
import { FullTagFragment } from '@wepublish/website/api';

export const BkaTagLabel = styled('span')`
  position: relative;
  color: ${({ theme }) => theme.palette.text.primary};
`;

export const BkaTagWrapper = styled('span')`
  position: relative;
  display: inline-block;
  white-space: nowrap;
  vertical-align: baseline;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.body1.fontFamily};
  font-size: inherit;
  font-weight: 400;
  line-height: 1;
  border: 1.5px solid transparent;
  border-radius: 2px;
  padding: 0.2em 0.365em 0.2em calc(1.765em - 3px);

  &::before {
    content: '';
    position: absolute;
    top: -1.5px;
    left: -1.5px;
    width: calc(100% + 3px);
    height: calc(100% + 3px);
    border: 1.5px solid ${({ theme }) => theme.palette.text.primary};
    border-radius: 2px;
  }

  &::after {
    content: '';
    position: absolute;
    top: -1.5px;
    left: -3px;
    height: calc(100% + 3px);
    aspect-ratio: 1 / 1;
    display: block;
    z-index: 2;
    background: currentcolor;
    border-top-left-radius: 2px;
    border-bottom-left-radius: 2px;
  }
`;

export const BkaTagList = styled('div')`
  display: flex;
  font-size: 0.75rem;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export type BkaTagProps = {
  tag: Pick<FullTagFragment, 'id' | 'tag'> & { color?: string | null };
  className?: string;
};

export const BkaTag = ({ tag, className }: BkaTagProps) => {
  if (!tag.tag) {
    return null;
  }

  return (
    <BkaTagWrapper
      className={className}
      style={{ color: tag.color ?? '#000000' }}
    >
      <BkaTagLabel>{tag.tag}</BkaTagLabel>
    </BkaTagWrapper>
  );
};
