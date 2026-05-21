/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebsiteSettings } from '@wepublish/website/api';

declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare global {
  interface Window {
    WEBSITE_SETTINGS: WebsiteSettings;
  }
}
