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
  abstract createPixelUris(props: CreateTrackingPixelProps): Promise<string[]>
}
