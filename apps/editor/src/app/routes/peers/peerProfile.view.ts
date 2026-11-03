import { formView } from '@wepublish/form/editor';

import { peerProfileSchema } from './peerProfile.schema';

export const peerProfileView = formView(peerProfileSchema, {
  sections: [
    {
      title: 'peerList.panels.information',
      fields: [
        'name',
        ['logo', 'squareLogo'],
        ['themeColor', 'themeFontColor'],
      ],
    },
    {
      title: 'peerList.panels.callToActionText',
      description: 'peerList.panels.callToActionInfo',
      fields: ['callToActionText', 'callToActionURL'],
    },
    {
      title: 'peerList.panels.callToActionImage',
      description: 'peerList.panels.ctaImageInfo',
      fields: ['callToActionImage', 'callToActionImageURL'],
    },
  ],
});
