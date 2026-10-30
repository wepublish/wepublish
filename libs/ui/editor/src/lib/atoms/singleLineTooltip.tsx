import styled from '@emotion/styled';
import { Tooltip, TooltipProps } from '@mui/material';
import { tooltipClasses } from '@mui/material/Tooltip';

export const SingleLineTooltip = styled(
  ({ className, ...props }: TooltipProps) => (
    <Tooltip
      {...props}
      classes={{ popper: className }}
    />
  )
)`
  & .${tooltipClasses.tooltip} {
    width: max-content;
    max-width: calc(100vw - 32px);
  }
`;
