import {ElementID} from '../elementID'
import {useStaticStyle, useFont} from '@karma.run/react'

export const MonumentGroteskFont = 'Monument Grotesk'

export function GlobalStyles() {
  const staticCSS = useStaticStyle()
  const font = useFont()

  font(
    MonumentGroteskFont,
    ['/static/fonts/MonumentGrotesk-Regular.woff', '/static/fonts/MonumentGrotesk-Regular.woff2'],
    {
      fontWeight: 'normal'
    }
  )

  font(
    MonumentGroteskFont,
    ['/static/fonts/MonumentGrotesk-Bold.woff', '/static/fonts/MonumentGrotesk-Bold.woff2'],
    {
      fontWeight: 'bold'
    }
  )

  staticCSS('html', {
    fontFamily: `"${MonumentGroteskFont}", Arial, sans-serif`,
    fontSize: '62.5%'
  })

  staticCSS(`body, html, #${ElementID.ReactRoot}`, {
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0
  })

  staticCSS('body', {
    fontSize: '1.6rem'
  })

  staticCSS('a, a:link, a:visited, a:hover, a:active', {
    color: 'inherit',
    textDecoration: 'none'
  })

  staticCSS('*, :after, :before', {
    boxSizing: 'border-box'
  })

  return null
}
