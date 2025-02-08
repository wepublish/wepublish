import {PropsWithChildren} from 'react'
import {InlineAvatar} from '../inlineAvatar'
import {FullPeerFragment as V2FullPeerFragment} from '@wepublish/editor/api-v2'
import {FullPeerFragment} from '@wepublish/editor/api'

export const PeerAvatar = ({
  peer,
  children
}: PropsWithChildren<{peer?: FullPeerFragment | V2FullPeerFragment | null}>) => {
  return (
    <InlineAvatar
      children={children}
      url={peer ? `/peering/edit/${peer?.id}` : undefined}
      src={peer?.profile?.logo?.thumbURL}
      title={peer?.name}
      showAvatar={!!peer}
    />
  )
}
