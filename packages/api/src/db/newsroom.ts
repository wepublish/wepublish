import {RichTextNode} from '../graphql/richText'

export interface NewsroomProfile {
  id: string
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
  isSelf: boolean
}
