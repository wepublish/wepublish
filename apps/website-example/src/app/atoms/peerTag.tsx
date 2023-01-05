import React from 'react'
import {Image, ImageProps} from './image'

export interface PeerTagProps extends ImageProps {}

export function PeerTag(props: PeerTagProps) {
  return <Image src={props.src} width={props.width} height={props.height} />
}
