export const MediaReferenceType = '_media'

export interface Reference {
  recordId: string
  contentType: string
  peerId?: string
  record?: unknown
  peer?: unknown
}
