import styled from '@emotion/styled';
import { Tooltip } from 'rsuite';

/**
 * Tooltip for ids and other unbreakable values: rsuite caps tooltips at
 * 250px, which wraps a UUID onto two lines. This one grows to its content
 * and only wraps when the viewport is narrower than that.
 */
export const SingleLineTooltip = styled(Tooltip)`
  && {
    width: max-content;
    max-width: calc(100vw - 32px);
  }
`;
