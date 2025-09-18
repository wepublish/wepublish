import {FullPeerFragment} from '@wepublish/editor/api'
import {FullPeerFragment as V2FullPeerFragment} from '@wepublish/editor/api-v2'
import {PropsWithChildren} from 'react'

import {InlineAvatar} from '../inlineAvatar'

export const PeerAvatar = ({
  peer,
  children
}: PropsWithChildren<{peer?: FullPeerFragment | V2FullPeerFragment | null}>) => {
  const logo = peer?.profile?.squareLogo ?? peer?.profile?.logo
  const logoUrl = logo
    ? 'thumbURL' in logo
      ? logo.thumbURL
      : 'xxsSquare' in logo
      ? logo.xxsSquare
      : null
    : null

  return (
    <InlineAvatar
      children={children}
      url={peer ? `/peering/edit/${peer?.id}` : undefined}
      src={logoUrl}
      title={peer?.name}
      showAvatar={!!peer}
    />
  )
}
