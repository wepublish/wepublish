import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Link from 'next/link'

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <MuiLink component={Link} color="inherit" href="https://wepublish.ch/">
        We.Publish
      </MuiLink>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  )
}

export const Footer = () => {
  return (
    <Box component="footer" sx={{margin: '48px'}}>
      <Container maxWidth="lg">
        <Copyright />
      </Container>
    </Box>
  )
}
