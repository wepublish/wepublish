import {css, styled} from '@mui/material'
import {Button} from '@wepublish/ui'
import {RichTextBlock} from '@wepublish/website'
import {useState} from 'react'
import {MdInfoOutline} from 'react-icons/md'
import {Node} from 'slate'

export const InfoBoxWrapper = styled('aside')<{expanded: boolean}>`
  width: ${({theme}) => theme.spacing(38)};
  grid-column: -1/1;
  display: grid;
  grid-template-columns: ${({theme}) => theme.spacing(4)} 1fr;
  gap: ${({theme}) => theme.spacing(1)};
  height: ${({theme}) => theme.spacing(28)};
  transition: height 0.3s ease;
  background-color: ${({theme}) => theme.palette.common.white};
  padding: ${({theme}) => theme.spacing(1.5)};
  border-radius: ${({theme}) => theme.spacing(2.5)};

  ${({expanded}) =>
    expanded &&
    css`
      height: auto;
    `}
`

const AllAbout = styled('div')`
  color: ${({theme}) => theme.palette.common.black};
  font-size: 21px;
  font-weight: 600;
  margin-bottom: ${({theme}) => theme.spacing(1)};
`

const RichTextBlockWrapper = styled('div')<{expanded: boolean}>`
  height: ${({theme}) => theme.spacing(14)};
  max-height: ${({theme}) => theme.spacing(14)};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;

  ${({theme, expanded}) =>
    expanded &&
    css`
      height: auto;
      max-height: ${theme.spacing(100)};
    `}
`

const InfoBoxInfo = styled('div')`
  color: ${({theme}) => theme.palette.common.black};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: ${({theme}) => theme.spacing(0.5)};
`

const IconWrapper = styled('div')`
  width: ${({theme}) => theme.spacing(3)};
  height: ${({theme}) => theme.spacing(3)};
`

const InfoBoxContent = styled('div')``

const ReadMore = styled(Button)`
  margin-top: ${({theme}) => theme.spacing(1)};
  padding: ${({theme}) => theme.spacing(0.5)} ${({theme}) => theme.spacing(1.5)};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 300;
  font-size: 10px;
  color: ${({theme}) => theme.palette.common.black};
  border: 1px solid ${({theme}) => theme.palette.common.black};
  background-color: transparent;
  transition: background-color 0.25s ease-in-out;

  :hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
`

export const InfoBox = ({richText}: {richText: Node[]}) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <InfoBoxWrapper expanded={expanded}>
      <InfoBoxInfo>
        <IconWrapper>
          <MdInfoOutline size="24" />
        </IconWrapper>
      </InfoBoxInfo>

      <InfoBoxContent>
        <AllAbout>Darum geht’s:</AllAbout>

        <RichTextBlockWrapper expanded={expanded}>
          <RichTextBlock richText={richText} />
        </RichTextBlockWrapper>

        <ReadMore onClick={() => setExpanded(expanded => !expanded)}>alles lesen</ReadMore>
      </InfoBoxContent>
    </InfoBoxWrapper>
  )
}
