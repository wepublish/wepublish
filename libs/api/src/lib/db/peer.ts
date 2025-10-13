import { RichTextNode } from '@wepublish/richtext/api';

export interface PeerProfile {
  name: string;
  squareLogoId?: string | null;
  logoID?: string | null;
  themeColor: string;
  themeFontColor: string;
  callToActionText: RichTextNode[];
  callToActionURL: string;
  callToActionImageID?: string | null;
  callToActionImageURL?: string | null;
}
