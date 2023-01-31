import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Box from '@mui/material/Box'
import {EventRefFragment} from '@wepublish/editor/api'
import Link from 'next/link'
import {RichTextBlock} from './richTextBlock/richTextBlock'
import styled from '@emotion/styled'

interface TipOfTheDayProps {
  event: EventRefFragment
}

const RichText = styled(Typography)`
  max-height: 60px;
  overflow-y: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const TipOfTheDay = ({event}: TipOfTheDayProps) => {
  return (
    <Paper
      sx={{
        borderRadius: '5px',
        minHeight: '40vh',
        position: 'relative',
        backgroundColor: 'grey.800',
        color: '#fff',
        mb: 4,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url(${event.image.largeURL})`
      }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          left: 0,
          backgroundColor: 'rgba(0,0,0,.3)',
          borderRadius: '5px'
        }}
      />

      <Grid container>
        <Grid item md={6}>
          <Box
            sx={{
              position: 'relative',
              p: {xs: 3, md: 6},
              pr: {md: 0}
            }}>
            <Typography variant="h6" color="inherit" gutterBottom>
              Tipp des Tages
            </Typography>

            <Typography component="h1" variant="h3" color="inherit" gutterBottom>
              {event.name}
            </Typography>

            <RichText variant="h5" color="inherit" paragraph>
              <RichTextBlock displayOnly value={event.description} />
            </RichText>

            <MuiLink component={Link} variant="subtitle1" href={`/events/${event.id}`}>
              Read more
            </MuiLink>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}
