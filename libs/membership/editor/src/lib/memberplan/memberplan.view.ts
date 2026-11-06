import { ProductType } from '@wepublish/editor/api';
import {
  bindComponent,
  formView,
  MultiSelectField,
  SelectField,
  uniqueConstraint,
} from '@wepublish/form/editor';
import { ALL_PAYMENT_PERIODICITIES } from '@wepublish/ui/editor';
import { slugify } from '@wepublish/utils';

import { MemberPlanPricingField } from './memberplan-pricing';
import { MemberPlanTrial } from './memberplan-trial';
import {
  enabledPeriodicitiesOf,
  type MemberPlanFormValues,
  memberPlanSchema,
} from './memberplan.schema';

const pricing = bindComponent(MemberPlanPricingField);
const paymentMethodSelect = bindComponent(SelectField);
const paymentMethodsSelect = bindComponent(MultiSelectField);

const productTypeLabels = {
  [ProductType.Subscription]: 'memberplanForm.productTypeSubscription',
  [ProductType.Donation]: 'memberplanForm.productTypeDonation',
};

const isDonation = ({ productType }: MemberPlanFormValues) =>
  productType === ProductType.Donation;

export const memberPlanView = formView(memberPlanSchema, {
  paths: {
    list: '/memberplans',
    edit: id => `/memberplans/edit/${id}`,
  },
  sections: [
    {
      title: 'memberplanForm.sections.general',
      fields: [['name', 'slug'], 'productType', 'active'],
    },
    {
      title: 'memberplanForm.sections.texts',
      fields: ['description', 'shortDescription', 'externalReward'],
    },
    {
      title: 'memberPlanEdit.paymentConfigs',
      fields: ['availablePaymentMethods'],
    },
    {
      title: 'memberplanForm.periodicityPricing',
      fields: [['currency', 'defaultPaymentPeriodicity'], 'periodicityPricing'],
    },
    {
      title: 'memberplanForm.trialSubscription',
      placement: 'aside',
      fields: ['extendable', 'maxCount', 'migrateToTargetPaymentMethodID'],
      component: MemberPlanTrial,
    },
    {
      title: 'memberplanForm.redirectionsTitle',
      placement: 'aside',
      fields: ['successPageId', 'failPageId', 'confirmationPageId'],
    },
    {
      title: 'memberplanForm.sections.media',
      placement: 'aside',
      fields: ['image', 'tags'],
    },
  ],
  fields: {
    slug: { normalize: slug => slugify(slug ?? '') },
    productType: { optionLabel: productType => productTypeLabels[productType] },
    availablePaymentMethods: {
      props: { addLabel: 'memberplanForm.addPaymentMethods' },
    },
    'availablePaymentMethods.*.paymentMethodIds': {
      component: paymentMethodsSelect,
    },
    'availablePaymentMethods.*.paymentPeriodicities': {
      options: ALL_PAYMENT_PERIODICITIES,
    },
    defaultPaymentPeriodicity: {
      options: ({ availablePaymentMethods }) =>
        enabledPeriodicitiesOf(availablePaymentMethods),
    },
    periodicityPricing: { component: pricing, hideLabel: true },
    maxCount: {
      label: values =>
        isDonation(values) ?
          'memberplanForm.maxCountDonation'
        : 'memberplanForm.maxCount',
      description: values =>
        isDonation(values) ?
          'memberplanForm.maxCountDonationHelpText'
        : 'memberplanForm.maxCountHelpText',
    },
    migrateToTargetPaymentMethodID: { component: paymentMethodSelect },
  },
  serverErrors: [
    {
      match: uniqueConstraint('slug'),
      path: 'slug',
      error: 'memberPlanEdit.slugTaken',
    },
  ],
});
