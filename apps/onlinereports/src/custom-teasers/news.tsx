import {MdEast} from 'react-icons/md'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {extractTeaserData} from '@wepublish/block-content/website'
import styled from '@emotion/styled'

const NewsTeaserUnstyled = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const {title, preTitle, href} = extractTeaserData(teaser)
  const {
    elements: {H4, Link}
  } = useWebsiteBuilder()
  return (
    <Link href={href} className={className}>
      <span>{preTitle}</span>
      <div>
        <H4 gutterBottom>{title}</H4>
        <MdEast />
      </div>
    </Link>
  )
}

export const NewsTeaser = styled(NewsTeaserUnstyled)`
  color: ${({theme}) => theme.palette.text.primary};
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(0)}`};
  border-bottom: 1px solid ${({theme}) => theme.palette.divider};
  text-decoration: none;

  * {
    font-size: 18px !important;
  }

  > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    :first-child {
      flex-grow: 1;
    }

    svg {
      min-width: 18px;
    }
  }

  > span {
    display: inline-block;
    font-weight: 500;
    line-height: 1.2;
  }

  h4 {
    font-weight: 300;
  }
`
