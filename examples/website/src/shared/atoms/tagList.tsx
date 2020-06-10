import React from 'react'
import {Peer} from '../types'
import {useStyle, cssRule} from '@karma.run/react'

import {Tag} from './tag'
import {Link, TagRoute} from '../route/routeContext'

export const TagListStyle = cssRule({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '-10px'
})

export interface TagListProps {
  peer?: Peer
  tags?: string[]
}

export function TagList({peer, tags}: TagListProps) {
  const css = useStyle()

  return (
    <div className={css(TagListStyle)}>
      {peer && (
        <Link href={peer.websiteURL}>
          <Tag iconURL={peer.logoURL} title={new URL(peer.websiteURL).hostname} />
        </Link>
      )}
      {tags &&
        tags.map(tag => (
          <Link key={tag} route={TagRoute.create({tag: tag})}>
            <Tag key={tag} title={tag} />
          </Link>
        ))}
    </div>
  )
}
