import {createRenderer} from 'fela'
import felaPrefixer from 'fela-plugin-prefixer'
import felaFallbackValue from 'fela-plugin-fallback-value'
import {onlyMobileMediaQuery, tabletMediaQuery, desktopMediaQuery} from '../style/helpers'

export function storybookCreateStyleRenderer() {
  return createRenderer({
    devMode: true,
    mediaQueryOrder: [onlyMobileMediaQuery, tabletMediaQuery, desktopMediaQuery],
    plugins: [felaPrefixer(), felaFallbackValue()]
  })
}
