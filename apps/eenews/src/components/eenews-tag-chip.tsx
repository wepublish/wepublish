import styled from '@emotion/styled';
import { BuilderTagProps } from '@wepublish/website/builder';

import { eenewsColors } from '../theme';

const Chip = styled('span')<{
  variant: 'default' | 'accent' | 'ghost' | 'dark';
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 999px;
  white-space: nowrap;
  ${({ variant }) => {
    if (variant === 'accent') {
      return `background: ${eenewsColors.accent}; color: ${eenewsColors.ink};`;
    }
    if (variant === 'ghost') {
      return `background: transparent; border: 1px solid ${eenewsColors.ruleStrong}; color: ${eenewsColors.inkSoft};`;
    }
    if (variant === 'dark') {
      return `background: ${eenewsColors.ink}; color: ${eenewsColors.paper};`;
    }
    return `background: ${eenewsColors.paperWarm}; color: ${eenewsColors.ink};`;
  }}
`;

type EenewsTagChipProps = BuilderTagProps & {
  variant?: 'default' | 'accent' | 'ghost' | 'dark';
};

export const EenewsTagChip = ({
  className,
  tag,
  variant = 'default',
}: EenewsTagChipProps) => {
  const tagObject = tag?.data?.tag;
  if (!tagObject?.tag) {
    return null;
  }
  return (
    <Chip
      className={className}
      variant={variant}
    >
      {tagObject.tag}
    </Chip>
  );
};
