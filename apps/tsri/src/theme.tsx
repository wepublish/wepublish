import {createTheme, Theme, ThemeOptions} from '@mui/material'
import {theme as WePTheme} from '@wepublish/ui'
import {PartialDeep} from 'type-fest'

const theme = createTheme(WePTheme, {} as PartialDeep<Theme> | ThemeOptions)

export {theme as default}
