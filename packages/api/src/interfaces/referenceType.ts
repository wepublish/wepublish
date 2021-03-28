export const MediaReferenceType = '__media'

export interface Reference {
  recordId: string
  contentType: string
  peerId?: string
  record?: unknown
  peer?: unknown
}
