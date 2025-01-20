export type CreatePixelProps = {
  count: number
}

export interface CountPixelProvider {
  createPixel(props: CreatePixelProps)
}

export abstract class BasePixelProvider implements CountPixelProvider {
  abstract createPixel(props: CreatePixelProps)
}
