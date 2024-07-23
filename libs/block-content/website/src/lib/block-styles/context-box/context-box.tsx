import {css, styled} from '@mui/material'
import {useReducer} from 'react'
import {MdInfoOutline} from 'react-icons/md'
import {RichTextBlock} from '../../richtext/richtext-block'
import {allPass} from 'ramda'
import {hasBlockStyle} from '../../blocks'
import {isBreakBlock} from '../../break/break-block'
import {BuilderBlockStyleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, LinkPageBreakBlock} from '@wepublish/website/api'

export const ContextBoxWrapper = styled('aside')`
  display: grid;
  grid-template-columns: 36px 1fr;
  grid-auto-rows: max-content;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: stretch;
  padding: ${({theme}) => theme.spacing(1)};
`

export const ContextBoxAllAbout = styled('div')`
  align-self: center;
  font-weight: 600;
`

export const ContextBoxTitle = styled('div')`
  font-weight: 500;
  font-style: italic;
`

export const ContextBoxCollapse = styled('div')<{expanded: boolean}>`
  height: ${({theme}) => theme.spacing(15)};
  max-height: ${({theme}) => theme.spacing(15)};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  font-style: italic;

  ${({theme, expanded}) =>
    expanded &&
    css`
      height: auto;
      max-height: ${theme.spacing(100)};
    `}
`

export const ContextBoxContent = styled('div')`
  display: flex;
  flex-flow: column;
  align-items: start;
  gap: ${({theme}) => theme.spacing(1)};
`

export const ContextBoxLine = styled('div')`
  justify-self: center;
  width: ${({theme}) => theme.spacing(1)};
  background-color: currentColor;
`

export const ContextBoxIcon = styled(MdInfoOutline)``

export const ContextBox = ({className, richText, text}: BuilderBlockStyleProps['ContextBox']) => {
  const [expanded, toggleExpanded] = useReducer(exp => !exp, false)
  const {
    elements: {Button}
  } = useWebsiteBuilder()

  return (
    <ContextBoxWrapper className={className}>
      <ContextBoxIcon size="36" />

      <ContextBoxAllAbout>Darum geht’s:</ContextBoxAllAbout>

      <ContextBoxLine />
      <ContextBoxContent>
        <ContextBoxTitle>{text}</ContextBoxTitle>

        <ContextBoxCollapse expanded={expanded}>
          <RichTextBlock richText={richText} />
        </ContextBoxCollapse>

        <Button onClick={toggleExpanded}>Alles lesen</Button>
      </ContextBoxContent>
    </ContextBoxWrapper>
  )
}

export const isContextBoxBlockStyle = (block: Block): block is LinkPageBreakBlock =>
  allPass([hasBlockStyle('ContextBox'), isBreakBlock])(block)
