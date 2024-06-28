import {css, styled} from '@mui/material'
import {Button} from '@wepublish/ui'
import {BuilderBreakBlockProps, RichTextBlock} from '@wepublish/website'
import {useState} from 'react'
import {MdInfoOutline} from 'react-icons/md'

export const ContextBoxWrapper = styled('aside')<{expanded: boolean}>`
  margin-left: 10%;
  width: ${({theme}) => theme.spacing(38)};
  grid-column: -1/1;
  display: grid;
  grid-template-columns: ${({theme}) => theme.spacing(4)} 1fr;
  gap: ${({theme}) => theme.spacing(1)};
  height: ${({theme}) => theme.spacing(28)};
  transition: height 0.3s ease;

  ${({expanded}) =>
    expanded &&
    css`
      height: auto;
    `}
`

const AllAbout = styled('div')`
  color: ${({theme}) => theme.palette.secondary.dark};
  font-weight: 600;
  margin-bottom: ${({theme}) => theme.spacing(1)};
  margin-top: ${({theme}) => theme.spacing(1)};
`

const Title = styled('div')`
  font-weight: 500;
  font-style: italic;
  margin-bottom: ${({theme}) => theme.spacing(0.5)};
`

const RichTextBlockWrapper = styled('div')<{expanded: boolean}>`
  font-style: italic;
  line-height: 2;
  font-weight: 300;
  height: ${({theme}) => theme.spacing(15)};
  max-height: ${({theme}) => theme.spacing(15)};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;

  ${({theme, expanded}) =>
    expanded &&
    css`
      height: auto;
      max-height: ${theme.spacing(100)};
    `}
`

const ContextBoxInfo = styled('div')`
  color: ${({theme}) => theme.palette.secondary.dark};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const IconWrapper = styled('div')`
  width: ${({theme}) => theme.spacing(4.5)};
  height: ${({theme}) => theme.spacing(4.5)};
`

const ContextBoxContent = styled('div')``

const ReadMore = styled(Button)`
  margin-top: ${({theme}) => theme.spacing(1)};
  color: ${({theme}) => theme.palette.common.white};
  background-color: ${({theme}) => theme.palette.secondary.dark};
`

const ContextBoxLine = styled('div')`
  width: ${({theme}) => theme.spacing(1)};
  height: 100%;
  margin-top: ${({theme}) => theme.spacing(1)};
  background-color: ${({theme}) => theme.palette.secondary.dark};
`

export const ContextBox = ({richText, text}: BuilderBreakBlockProps) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <ContextBoxWrapper expanded={expanded}>
      <ContextBoxInfo>
        <IconWrapper>
          <MdInfoOutline size="36" />
        </IconWrapper>
        <ContextBoxLine />
      </ContextBoxInfo>

      <ContextBoxContent>
        <AllAbout>Darum geht’s</AllAbout>
        <Title>{text}</Title>

        <RichTextBlockWrapper expanded={expanded}>
          <RichTextBlock richText={richText} />
        </RichTextBlockWrapper>

        <ReadMore onClick={() => setExpanded(expanded => !expanded)}>alles lesen</ReadMore>
      </ContextBoxContent>
    </ContextBoxWrapper>
  )
}
