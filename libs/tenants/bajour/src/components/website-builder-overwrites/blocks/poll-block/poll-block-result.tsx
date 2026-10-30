import styled from '@emotion/styled';
import {
  PollBlockResult,
  PollBlockVoteBar,
  PollBlockVoteBarFill,
} from '@wepublish/block-content/website';

export const PollBlockResultOverwrite = styled(PollBlockResult)`
  ${PollBlockVoteBar} {
    font-size: 0.65em;
    padding: ${({ theme }) => `0 ${theme.spacing(1)}`};
    border-radius: ${({ theme }) => theme.spacing(1)};
  }

  ${PollBlockVoteBarFill} {
    ${({ highlight, theme }) =>
      highlight &&
      `
      background-color: ${theme.palette.primary.main};
    `}
  }
`;
