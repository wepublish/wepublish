import {RichTextNode} from '../graphql/richText'

export interface PeerProfile {
  name: string
  logoID?: string | null
  themeColor: string
  themeFontColor: string
  callToActionText: RichTextNode[]
  callToActionURL: string
  callToActionImageID?: string | null
  callToActionImageURL?: string | null
}
