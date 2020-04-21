import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'

export const IconStyle = cssRule({
  '> svg': {height: '1em'}
})

export const BlockIconStyle = cssRule({
  '> svg': {display: 'block'}
})

export enum IconType {
  Close = 'close',
  Hamburger = 'hamburger',
  Search = 'search',
  Next = 'next',
  Previous = 'previous',
  Maximize = 'maximize',
  Minimize = 'minimize',
  Facebook = 'facebook',
  Twitter = 'twitter',
  Instagram = 'instagram',
  Website = 'website',
  Mail = 'mail',
  Phone = 'phone',
  Play = 'play'
}

export interface IconProps {
  readonly type: IconType
}

export function InlineIcon({type}: IconProps) {
  const css = useStyle()

  return (
    <span className={css(IconStyle)} role="img">
      {iconForType(type)}
    </span>
  )
}

export function BlockIcon({type}: IconProps) {
  const css = useStyle()

  return (
    <div className={css(BlockIconStyle, IconStyle)} role="img">
      {iconForType(type)}
    </div>
  )
}

export function iconForType(type: IconType, color?: string) {
  switch (type) {
    case IconType.Close:
      return <CloseIcon />

    case IconType.Hamburger:
      return <HamburgerIcon />

    case IconType.Search:
      return <SearchIcon />

    case IconType.Facebook:
      return <FacebookIcon />

    case IconType.Twitter:
      return <TwitterIcon />

    case IconType.Mail:
      return <MailIcon />

    case IconType.Phone:
      return <PhoneIcon />

    case IconType.Instagram:
      return <InstagramIcon />

    case IconType.Website:
      return <WebsiteIcon />

    case IconType.Maximize:
      return <MaximizeIcon />

    case IconType.Minimize:
      return <MinimizeIcon />

    case IconType.Next:
      return <NextIcon />

    case IconType.Previous:
      return <PreviousIcon />

    case IconType.Play:
      return <PlayIcon />
  }
}

export function CloseIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 31 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.82812" y="0.79718" width="40" height="2" transform="rotate(45 1.82812 0.79718)" />
      <rect x="0.414062" y="29.0815" width="40" height="2" transform="rotate(-45 0.414062 29.0815)" />
    </svg>
  )
}

export function HamburgerIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 26 12" xmlns="http://www.w3.org/2000/svg">
      <rect width="26" height="2" fill="#202020" />
      <rect y="10" width="26" height="2" fill="#202020" />
    </svg>
  )
}

// TODO: Convert SVG to path that can be colored via `fill` instead of `stroke`.
export function SearchIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 29 29" xmlns="http://www.w3.org/2000/svg">
      <path strokeWidth="2" d="M21.9073 12.0709C21.9073 17.9186 17.2174 22.6418 11.4536 22.6418C5.68983 22.6418 1 17.9186 1 12.0709C1 6.22312 5.68983 1.5 11.4536 1.5C17.2174 1.5 21.9073 6.22312 21.9073 12.0709Z" />
      <path strokeWidth="2" d="M21.6367 21.0717L27.9999 27.5" />
    </svg>
  )
}

export function FacebookIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 12 27" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 27H2.72V13.414H0V8.7707H2.72V6.01911C2.72 2.23567 4.16 0 8.48 0H12V4.64331H9.76C8.16 4.64331 8 5.33121 8 6.53503V8.94268H12L11.52 13.414H8V27Z" />
    </svg>
  )
}

export function TwitterIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 27 22" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M23.8193 3.47812C24.9635 2.79171 25.8415 1.70331 26.2536 0.40676C25.1822 1.04391 23.9984 1.50469 22.7353 1.75415C21.7274 0.673697 20.2868 0 18.6926 0C15.6339 0 13.1553 2.48664 13.1553 5.55323C13.1553 5.98859 13.2013 6.41283 13.2964 6.818C8.69414 6.58602 4.61331 4.37744 1.87956 1.01531C1.40254 1.83836 1.12995 2.79171 1.12995 3.80861C1.12995 5.73436 2.10777 7.43449 3.5943 8.43233C2.68621 8.40373 1.83201 8.15109 1.08399 7.73798V7.8063C1.08399 10.4979 2.99208 12.743 5.52932 13.2515C5.06339 13.3818 4.57528 13.4469 4.06814 13.4469C3.71157 13.4469 3.36292 13.4135 3.02694 13.3484C3.73059 15.5538 5.77655 17.1618 8.20127 17.2047C6.30428 18.6951 3.91601 19.5817 1.32171 19.5817C0.874801 19.5817 0.432647 19.5578 0 19.5054C2.45166 21.08 5.36292 22 8.49128 22C18.6815 22 24.2504 13.5375 24.2504 6.19832C24.2504 5.95681 24.2472 5.71689 24.2361 5.48014C25.3185 4.69681 26.2599 3.71804 27 2.60422C26.0063 3.04593 24.9382 3.34465 23.8193 3.47812Z" />
    </svg>
  )
}

export function MailIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.5679 0.947357L11.6286 8.99999C11.55 9.03946 11.4714 9.07894 11.3929 9.07894C11.3143 9.07894 11.2357 9.03946 11.1571 8.99999L0.314286 1.10525C0.117857 1.46052 0 1.89473 0 2.36841V12.6316C0 13.9737 0.982143 15 2.27857 15H19.6429C20.9393 15 22 13.9342 22 12.6316V2.36841C22 1.81578 21.8429 1.30262 21.5679 0.947357Z" />
      <path d="M21.0171 0.394737C20.6242 0.157895 20.1921 0 19.6421 0H2.35636C1.76708 0 1.21708 0.197368 0.824219 0.513158L11.3921 8.17105L21.0171 0.394737Z" />
    </svg>
  )
}

export function PhoneIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.1023 18.8276L22.323 16.0483C21.7403 15.4655 20.9782 15.1517 20.1265 15.1517C19.3196 15.1517 18.5127 15.4655 17.9299 16.0483L17.3023 16.6759C14.4782 14.3 11.7437 11.5655 9.36785 8.74138L9.99544 8.11379C11.2058 6.90345 11.2058 4.93103 9.99544 3.76552L7.1713 0.896552C6.58854 0.313793 5.82648 0 4.97475 0C4.12303 0 3.40579 0.313793 2.82303 0.896552L1.29889 2.42069C-0.180421 3.9 -0.404559 6.23103 0.760958 7.97931C5.24372 14.7931 11.2058 20.7552 18.0196 25.2828C18.7368 25.7759 19.5885 26 20.4403 26C21.6058 26 22.7265 25.5517 23.5334 24.7L25.0575 23.1759C26.3127 21.9655 26.3127 19.9931 25.1023 18.8276Z" />
    </svg>
  )
}

export function MinimizeIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M35.2383 35.1123L36.0309 43.8656L43.9917 35.9048L35.2383 35.1123Z" />
      <path d="M25.754 35.1133L17.0006 35.9059L24.9614 43.8667L25.754 35.1133Z" />
      <path d="M25.7539 24.753L24.9613 15.9996L17.0005 23.9604L25.7539 24.753Z" />
      <path d="M35.2382 24.7539L43.9916 23.9613L36.0308 16.0005L35.2382 24.7539Z" />
    </svg>
  )
}

export function MaximizeIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 61 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M45.5107 44.8848L44.7181 36.1314L36.7573 44.0923L45.5107 44.8848Z" />
      <path d="M16.4804 44.8867L25.2338 44.0941L17.273 36.1333L16.4804 44.8867Z" />
      <path d="M16.4805 14.9804L17.2731 23.7338L25.2339 15.773L16.4805 14.9804Z" />
      <path d="M45.5118 14.9805L36.7584 15.7731L44.7192 23.7339L45.5118 14.9805Z" />
    </svg>
  )
}

export function NextIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 61 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M36.5 30.5L28.25 22.2728V38.7272L36.5 30.5Z" />
    </svg>
  )
}

export function PreviousIcon() {
  // prettier-ignore
  return (
    <svg viewBox="0 0 61 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M24.5 30.5L32.75 22.2728V38.7272L24.5 30.5Z" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8L0.249999 15.7942L0.25 0.205771L16 8Z" />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26">
      <path d="M 7.546875 0 C 3.390625 0 0 3.390625 0 7.546875 L 0 18.453125 C 0 22.609375 3.390625 26 7.546875 26 L 18.453125 26 C 22.609375 26 26 22.609375 26 18.453125 L 26 7.546875 C 26 3.390625 22.609375 0 18.453125 0 Z M 7.546875 2 L 18.453125 2 C 21.527344 2 24 4.46875 24 7.546875 L 24 18.453125 C 24 21.527344 21.53125 24 18.453125 24 L 7.546875 24 C 4.472656 24 2 21.53125 2 18.453125 L 2 7.546875 C 2 4.472656 4.46875 2 7.546875 2 Z M 20.5 4 C 19.671875 4 19 4.671875 19 5.5 C 19 6.328125 19.671875 7 20.5 7 C 21.328125 7 22 6.328125 22 5.5 C 22 4.671875 21.328125 4 20.5 4 Z M 13 6 C 9.144531 6 6 9.144531 6 13 C 6 16.855469 9.144531 20 13 20 C 16.855469 20 20 16.855469 20 13 C 20 9.144531 16.855469 6 13 6 Z M 13 8 C 15.773438 8 18 10.226563 18 13 C 18 15.773438 15.773438 18 13 18 C 10.226563 18 8 15.773438 8 13 C 8 10.226563 10.226563 8 13 8 Z" />
    </svg>
  )
}

export function WebsiteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" />
    </svg>
  )
}
