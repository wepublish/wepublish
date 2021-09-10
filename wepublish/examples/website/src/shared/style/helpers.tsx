import {CSSStyle} from '@karma.run/react'

export function pxToRem(px: number) {
  return `${px / 10}rem`
}

export enum Breakpoint {
  Mobile = 0,
  Tablet = 600,
  Desktop = 1000
}

export enum ZIndex {
  Default = 0,
  Overlay = 1,
  Header = 2,
  Navigation = 3,
  FullscreenOverlay = 4
}

export const onlyMobileMediaQuery = `screen and (max-width: ${Breakpoint.Tablet - 1}px)`

export function whenMobile(styles: CSSStyle) {
  // prettier-ignore
  return {
    [`@media ${onlyMobileMediaQuery}`]: styles
  }
}

export const tabletMediaQuery = `screen and (min-width: ${Breakpoint.Tablet}px) and (max-width: ${
  Breakpoint.Desktop - 1
}px)`

export function whenTablet(styles: CSSStyle) {
  // prettier-ignore
  return {
    [`@media ${tabletMediaQuery}`]: styles
  }
}

export const desktopMediaQuery = `screen and (min-width: ${Breakpoint.Desktop}px)`

export function whenDesktop(styles: CSSStyle) {
  // prettier-ignore
  return {
    [`@media ${desktopMediaQuery}`]: styles
  }
}

export function hexToRgb(color: String) {
  let r = '',
    g = '',
    b = ''

  // 3 digits
  if (color.length == 4) {
    r = '0x' + color[1] + color[1]
    g = '0x' + color[2] + color[2]
    b = '0x' + color[3] + color[3]

    // 6 digits
  } else if (color.length == 7) {
    r = '0x' + color[1] + color[2]
    g = '0x' + color[3] + color[4]
    b = '0x' + color[5] + color[6]
  }

  return `${parseInt(r)},${parseInt(g)},${parseInt(b)}`
}
