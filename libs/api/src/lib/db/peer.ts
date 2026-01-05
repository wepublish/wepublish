import { RichtextJSONDocument } from '@wepublish/richtext';

export interface PeerProfile {
  name: string;
  squareLogoId?: string | null;
  logoID?: string | null;
  themeColor: string;
  themeFontColor: string;
  callToActionText: RichtextJSONDocument;
  callToActionURL: string;
  callToActionImageID?: string | null;
  callToActionImageURL?: string | null;
}
