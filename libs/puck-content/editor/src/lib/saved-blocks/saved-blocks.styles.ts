import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import { Link } from 'react-router-dom';

export const SavedBlocksEmpty = styled.p`
  display: grid;
  gap: var(--puck-space-2);
  justify-items: start;
  margin: 0;
  padding: 0 var(--puck-space-1);
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
`;

export const SavedBlocksEmptyLink = styled(Link)`
  color: var(--puck-color-interactive);
  font-weight: var(--puck-font-weight-semibold);
`;

export const SavedBlocksMore = styled.button`
  margin: var(--puck-space-2) var(--puck-space-1) 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--puck-color-interactive);
  font: inherit;
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-semibold);
  cursor: pointer;
`;

export const SavedBlockModesButton = styled(IconButton)`
  margin-left: auto;
  margin-right: calc(-1 * var(--puck-space-1));
`;
