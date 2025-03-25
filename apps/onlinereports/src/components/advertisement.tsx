import styled from '@emotion/styled'
import {Box, useMediaQuery, useTheme} from '@mui/material'
import ReviveAd from './revive-ad'

type AdvertisementProps = {
  type: 'whiteboard' | 'half-page' | 'small'
}

export const Advertisement = ({type}: AdvertisementProps) => {
  const theme = useTheme()
  const notLg = useMediaQuery(theme.breakpoints.down('lg'), {
    ssrMatchMedia: () => ({matches: false})
  })

  if (type === 'whiteboard' && notLg) {
    type = 'small'
  }

  switch (type) {
    case 'whiteboard':
      return (
        <Wideboard>
          <ReviveAd reviveId={'727bec5e09208690b050ccfc6a45d384'} zoneId={'23516'} />
        </Wideboard>
      )
    case 'half-page':
      return (
        <HalfPage>
          <ReviveAd reviveId={'727bec5e09208690b050ccfc6a45d384'} zoneId={'23515'} />
        </HalfPage>
      )
    case 'small':
      return (
        <Small>
          <ReviveAd reviveId={'727bec5e09208690b050ccfc6a45d384'} zoneId={'23517'} />
        </Small>
      )
  }
}

const AdBox = styled(Box)`
  background: repeating-linear-gradient(-45deg, #dde8ee, #dde8ee 15px, #eee 15px, #eee 40px);
  //border: 5px solid #eee;
  margin: 0 auto;
`

const Wideboard = styled(AdBox)`
  &,
  img {
    height: 250px;
    width: 994px;
  }
`

const HalfPage = styled(AdBox)`
  &,
  img {
    height: 600px;
    width: 300px;
  }
`

const Small = styled(AdBox)`
  &,
  img {
    height: 250px;
    width: 300px;
  }
`
