export type CreateTrackingPixelProps = {
  count: number
}

export type TrackingPixelProps = {
  id: string
  name: string
  type: string
}

export interface TrackingPixelProvider {
  id: string
  type: string
  createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
}

export abstract class BaseTrackingPixelProvider implements TrackingPixelProvider {
  id: string
  name: string
  type: string
  constructor(props: TrackingPixelProps) {
    this.id = props.id
    this.name = props.name
    this.type = props.type
  }
  abstract createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
}
