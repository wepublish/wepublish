import { css } from '@mui/material';
import styled from '@emotion/styled';
import { PollAnswerWithVoteCount } from '@wepublish/website/api';

export const PollBlockResultWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export const PollBlockResultInfo = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-template-columns: 1fr max-content;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing(1)};
`;

export const PollBlockResultName = styled('div')`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const PollBlockResultPercentage = styled('div')`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

export const PollBlockVoteBar = styled('div')`
  position: relative;
  font-size: 0.75em;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(1)}`};
  position: relative;
  background-color: ${({ theme }) => theme.palette.grey[200]};
`;

export const PollBlockVoteBarFill = styled('div')<{ highlight: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.palette.grey[300]};
  z-index: 0;
  pointer-events: none;

  ${({ highlight, theme }) =>
    highlight &&
    css`
      background-color: ${theme.palette.primary.main};
    `}
`;

export const PollBlockVoteBarText = styled('div')<{ highlight: boolean }>`
  position: relative;
  color: ${({ theme }) =>
    theme.palette.getContrastText(theme.palette.grey[300])};

  ${({ highlight, theme }) =>
    highlight &&
    css`
      color: ${theme.palette.getContrastText(theme.palette.common.black)};
    `}
`;

type PollBlockResultProps = {
  highlight: boolean;
  voteCount: number;
  answer: PollAnswerWithVoteCount['answer'];
  totalVotes: number;
};

export const PollBlockResult = ({
  answer,
  voteCount,
  totalVotes,
  highlight,
}: PollBlockResultProps) => {
  const percentage: number | null =
    totalVotes ? (voteCount / totalVotes) * 100 : null;

  return (
    <PollBlockResultWrapper>
      <PollBlockResultInfo>
        <PollBlockResultName>{answer}</PollBlockResultName>

        {percentage != null && (
          <PollBlockResultPercentage>
            {Math.round(percentage)}%
          </PollBlockResultPercentage>
        )}
      </PollBlockResultInfo>

      <PollBlockVoteBar>
        <PollBlockVoteBarFill
          highlight={highlight}
          css={{ width: `${percentage}%` }}
        />
        <PollBlockVoteBarText highlight={highlight}>
          {voteCount} Stimmen
        </PollBlockVoteBarText>
      </PollBlockVoteBar>
    </PollBlockResultWrapper>
  );
};
