import {TrackingPixelProviderType} from '@prisma/client'

export type CreateTrackingPixelProps = {
  internalTrackingId: string
}

export type TrackingPixelProps = {
  id: string
  name: string
  type: TrackingPixelProviderType
}

export interface TrackingPixelProvider {
  id: string
  type: TrackingPixelProviderType
  createPixelUri(props: CreateTrackingPixelProps): Promise<PixelUrl>
}

export type PixelUrl = {
  pixelUid: string
  uri: string
}

export abstract class BaseTrackingPixelProvider implements TrackingPixelProvider {
  id: string
  name: string
  type: TrackingPixelProviderType
  constructor(props: TrackingPixelProps) {
    this.id = props.id
    this.name = props.name
    this.type = props.type
  }
  abstract createPixelUri(props: CreateTrackingPixelProps): Promise<PixelUrl>
}
