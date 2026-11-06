import { formView } from '@wepublish/form/editor';

import { bannerSchema } from './banner.schema';

export const bannerView = formView(bannerSchema, {
  paths: {
    list: '/banners',
    edit: id => `/banners/edit/${id}`,
  },
  sections: [
    {
      title: 'banner.form.content',
      fields: ['title', 'text', 'cta', 'image'],
    },
    { title: 'banner.form.actions', fields: ['actions'] },
    { title: 'banner.form.customContent', fields: ['html', 'embedUrl'] },
    {
      title: 'banner.form.timing',
      fields: ['delay', 'hideForMinutes', 'collapsible'],
    },
    {
      title: 'banner.form.displayOptions',
      placement: 'aside',
      fields: ['active', 'showForLoginStatus', 'showOnArticles', 'showOnPages'],
    },
  ],
  fields: {
    text: { props: { minRows: 5 } },
    html: { props: { minRows: 5 } },
    actions: { props: { variant: 'table', addLabel: 'banner.actions.add' } },
    delay: { props: { unit: 'form.units.seconds' } },
    hideForMinutes: { props: { unit: 'form.units.minutes' } },
  },
});
