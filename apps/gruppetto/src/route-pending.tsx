import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';

const Pending = styled('div')`
  display: grid;
  justify-items: center;
  align-content: start;
  padding: ${({ theme }) => theme.spacing(8)} 0;
  min-height: 50vh;
`;

/**
 * Shown while a route's component chunk or loader data is still in flight.
 *
 * `min-height` keeps the footer from jumping up to meet the header during the
 * gap, which is the other half of what makes the transition read as breakage.
 */
export const RoutePending = () => (
  <Pending>
    <CircularProgress aria-label="" />
  </Pending>
);
