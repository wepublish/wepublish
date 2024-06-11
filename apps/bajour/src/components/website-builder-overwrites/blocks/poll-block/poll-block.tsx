import {styled} from '@mui/material'
import {
  PollBlock as BasePollBlock,
  PollBlockMeta,
  PollBlockResultInfo,
  PollBlockResultName,
  PollBlockResultPercentage,
  PollBlockVoteBar,
  PollBlockVoteBarFill,
  RichTextBlockWrapper
} from '@wepublish/website'

export const PollBlock = styled(BasePollBlock)`
  ${PollBlockMeta} {
    display: none;
  }

  ${PollBlockResultName} {
    font-weight: 600;
    text-transform: uppercase;
  }

  ${PollBlockVoteBar} {
    font-size: 0.65em;
    line-height: 1.15em;
    padding: ${({theme}) => `0 ${theme.spacing(1)}`};
    border-radius: ${({theme}) => theme.spacing(1)};
  }

  ${PollBlockVoteBarFill} {
    border-radius: ${({theme}) => theme.spacing(1)};
  }

  ${PollBlockResultInfo} {
    grid-template-columns: repeat(12, 1fr);
    align-items: center;
  }

  ${PollBlockResultName} {
    grid-column: 1/11;
  }

  ${PollBlockResultPercentage} {
    grid-column: 11/13;
    display: grid;
    justify-content: end;
  }

  ${RichTextBlockWrapper} {
    display: none;
  }
`
