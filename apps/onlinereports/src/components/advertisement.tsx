import {Box, styled} from '@mui/material'

type AdvertisementProps = {
  type: 'whiteboard' | 'half-page' | 'small'
}

export const Advertisement = ({type}: AdvertisementProps) => {
  switch (type) {
    case 'whiteboard':
      return <Whiteboard />
    case 'half-page':
      return <HalfPage />
    case 'small':
      return <Small />
  }
}

const AdBox = styled(Box)`
  background: repeating-linear-gradient(-45deg, #dde8ee, #dde8ee 15px, #eee 15px, #eee 40px);
  border: 5px solid #eee;
  margin: 0 auto;
`

const Whiteboard = styled(AdBox)`
  height: 250px;
  width: 994px;
  @media (max-width: 1050px) {
    width: 300px;
  }
`

const HalfPage = styled(AdBox)`
  height: 600px;
  width: 300px;
`

const Small = styled(AdBox)`
  height: 250px;
  width: 300px;
`
