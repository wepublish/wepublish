export type CreateTrackingPixelProps = {
  count: number
}

export type TrackingPixelProps = {
  id: string
  name: string
}

export interface TrackingPixelProvider {
  id: string
  createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
}

export abstract class BaseTrackingPixelProvider implements TrackingPixelProvider {
  id: string
  name: string
  constructor(props: TrackingPixelProps) {
    this.id = props.id
    this.name = props.name
  }
  abstract createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
}
