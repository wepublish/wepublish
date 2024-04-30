import {styled} from '@mui/material'
import {PollBlockResult, PollBlockVoteBar, PollBlockVoteBarFill} from '@wepublish/website'

export const PollBlockResultOverwrite = styled(PollBlockResult)`
  ${PollBlockVoteBar} {
    font-size: 0.65em;
    padding: ${({theme}) => `0 ${theme.spacing(1)}`};
    border-radius: ${({theme}) => theme.spacing(1)};
  }

  ${PollBlockVoteBarFill} {
    ${({highlight, theme}) =>
      highlight &&
      `
      background-color: ${theme.palette.primary.main};
    `}
  }
`
