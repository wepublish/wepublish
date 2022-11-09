import {RichTextNode} from '../graphql/richText'

export interface NewsroomProfile {
  name: string
  slug?: string
  hostURL?: string
  token?: string
  isDisabled: string
  logoID?: string | null
  themeColor?: string
  themeFontColor?: string
  callToActionText?: RichTextNode[]
  callToActionURL?: string
  callToActionImageID?: string | null
  callToActionImageURL?: string | null
}
