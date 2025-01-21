export type CreatePixelProps = {
  count: number
}

export type CountPixelProps = {}

export interface CountPixelProvider {
  createPixelUris(props: CreatePixelProps): Promise<string[]>
}

export abstract class BasePixelProvider implements CountPixelProvider {
  abstract createPixelUris(props: CreatePixelProps): Promise<string[]>
}
