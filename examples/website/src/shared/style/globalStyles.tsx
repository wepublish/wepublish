import {ElementID} from '../elementID'
import {useStaticStyle} from '@karma.run/react'

export function GlobalStyles() {
  const staticCSS = useStaticStyle()

  staticCSS('html', {
    fontFamily: `Arial, sans-serif`,
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
