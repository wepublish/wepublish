import { formView } from '@wepublish/form/editor';

import { giftCodeOfferSchema } from './giftCodeOffer.schema';
import { GiftCodeOfferMailFields } from './giftCodeOfferMailFields';
import { GiftCodeOfferSaleFields } from './giftCodeOfferSaleFields';

export const giftCodeOfferView = formView(giftCodeOfferSchema, {
  paths: {
    list: '/gift-codes/offers',
    edit: id => `/gift-codes/offers/edit/${id}`,
  },
  sections: [
    {
      title: 'giftCodeOffer.form.sections.details',
      fields: ['name', 'description', 'image'],
    },
    {
      title: 'giftCodeOffer.form.sections.sale',
      placement: 'aside',
      fields: ['active'],
      component: GiftCodeOfferSaleFields,
      covers: [
        'memberPlanId',
        'periodicity',
        'price',
        'redemptionWindowMonths',
        'paymentMethodIds',
        'allowDiscountCodes',
        'autoRenew',
        'renewalPaymentMethodId',
      ],
    },
    {
      title: 'giftCodeOffer.form.sections.mails',
      description: 'giftCodeOffer.form.sections.mailsDescription',
      component: GiftCodeOfferMailFields,
      covers: ['purchaseMailTemplateId', 'redemptionMailTemplateId'],
    },
  ],
});
