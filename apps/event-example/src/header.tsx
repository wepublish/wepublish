import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import {MdSearch} from 'react-icons/md'
import MuiLink from '@mui/material/Link'
import Link from 'next/link'

interface HeaderProps {
  sections: ReadonlyArray<{
    title: string
    url: string
  }>
  title: string
}

export const Header = (props: HeaderProps) => {
  const {sections, title} = props

  return (
    <>
      <Toolbar sx={{borderBottom: 1, borderColor: 'divider'}}>
        <Button size="small">Subscribe</Button>
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          align="center"
          noWrap
          sx={{flex: 1}}>
          {title}
        </Typography>

        <IconButton>
          <MdSearch />
        </IconButton>

        <Button variant="outlined" size="small">
          Sign up
        </Button>
      </Toolbar>

      <Toolbar
        component="nav"
        variant="dense"
        sx={{justifyContent: 'space-around', overflowX: 'auto', marginBottom: '24px'}}>
        {sections.map(section => (
          <MuiLink
            component={Link}
            color="inherit"
            noWrap
            key={section.title}
            variant="body2"
            href={section.url}
            sx={{p: 1, flexShrink: 0}}>
            {section.title}
          </MuiLink>
        ))}
      </Toolbar>
    </>
  )
}
