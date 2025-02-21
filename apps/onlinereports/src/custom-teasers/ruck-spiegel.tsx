import {BuilderTeaserProps, extractTeaserData, useWebsiteBuilder} from '@wepublish/website'
import {styled} from '@mui/material'

const RuckSpiegelUnstyled = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const {title, href} = extractTeaserData(teaser)
  const {
    elements: {H4, Link}
  } = useWebsiteBuilder()
  return (
    <Link href={href} className={className}>
      <div>
        <H4 gutterBottom>{title}</H4>
      </div>
    </Link>
  )
}

export const RuckSpiegelTeaser = styled(RuckSpiegelUnstyled)`
  color: ${({theme}) => theme.palette.text.primary};
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(0)}`};
  border-bottom: 1px solid ${({theme}) => theme.palette.divider};
  text-decoration: none;

  * {
    font-size: 18px !important;
  }

  > div {
    padding-top: ${({theme}) => `${theme.spacing(1)}`};
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    :first-child {
      flex-grow: 1;
    }
  }

  > span {
    font-weight: 500;
  }

  h4 {
    font-weight: 300;
  }
`
