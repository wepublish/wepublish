import {createTheme} from '@mui/material'

const {
  palette: {augmentColor}
} = createTheme()

import {theme as WePTheme} from '@wepublish/ui'

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({color: {main: '#FF006B'}}), // pink e.g. header
    secondary: augmentColor({color: {main: '#F5FF64'}}), // green e.g. banner
    info: augmentColor({color: {main: '#7FFAB6'}}), // yellow e.g. details
    error: augmentColor({color: {main: '#FF0D62'}})
  }
})

export default theme
