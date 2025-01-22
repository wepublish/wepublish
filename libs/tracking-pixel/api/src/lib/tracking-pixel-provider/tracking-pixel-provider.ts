import {TrackingPixelProviderType} from '@prisma/client'

export type CreateTrackingPixelProps = {
  count: number
}

export type TrackingPixelProps = {
  id: string
  name: string
  type: TrackingPixelProviderType
}

export interface TrackingPixelProvider {
  id: string
  type: TrackingPixelProviderType
  createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
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
  abstract createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
}
