import {BuilderTeaserProps, extractTeaserData, useWebsiteBuilder} from '@wepublish/website'
import {Box, styled, Typography} from '@mui/material'

const GelesenUndGedachtUnstyled = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const {title, href} = extractTeaserData(teaser)
  const {
    elements: {H3, Link}
  } = useWebsiteBuilder()
  return (
    <Box className={className}>
      <Gelesen>
        <Box>Gelesen...</Box>
        <GelesenQuote variant={'subtitle2'}>«Umfrage-Institute blamieren sich»</GelesenQuote>
        <GelesenSource>bz Schlagzeile vom 8. November 2024 über den Trump-Wahlerfolg</GelesenSource>
      </Gelesen>
      <Gedacht>
        <Box>...und dabei gedacht</Box>
        <GedachtText variant={'subtitle2'}>
          Auch die Medien, die die Umfrage-Ergebnisse vorbehaltlos übernommen hatten.
        </GedachtText>
      </Gedacht>
    </Box>
  )
}

export const GelesenUndGedachtTeaser = styled(GelesenUndGedachtUnstyled)`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(2)};

  color: ${({theme}) => theme.palette.text.primary};
  text-decoration: none;
  font-size: 18px;
`

const Gelesen = styled(Box)`
  max-width: 500px;
  display: flex;
  flex-direction: column;
`

const GelesenQuote = styled(Typography)`
  font-size: 28px;
  font-weight: 600;
`
const GelesenSource = styled('div')`
  font-size: 14px;
`

const Gedacht = styled(Gelesen)`
  align-self: end;
`

const GedachtText = styled(Typography)`
  font-size: 28px;
  font-weight: 600;
`
