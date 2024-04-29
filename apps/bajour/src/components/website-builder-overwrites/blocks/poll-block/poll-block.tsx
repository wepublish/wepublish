import {styled} from '@mui/material'
import {
  PollBlock as BasePollBlock,
  PollBlockMeta,
  PollBlockResultInfo,
  PollBlockResultName,
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
    /* ${({highlight, theme}) =>
      highlight &&
      `
      background-color: ${theme.palette.common.black};
    `} */
  }

  ${PollBlockResultInfo} {
    grid-template-columns: auto;
  }

  ${RichTextBlockWrapper} {
    display: none;
  }
`
