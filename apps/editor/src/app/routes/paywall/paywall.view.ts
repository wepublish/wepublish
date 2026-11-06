import {
  type FormValues,
  formView,
  uniqueConstraint,
} from '@wepublish/form/editor';

import { BypassTokenRow } from './bypassTokenRow';
import { paywallSchema } from './paywall.schema';

const memberPlansLocked = ({
  anyMemberPlan,
}: FormValues<typeof paywallSchema>) => anyMemberPlan === true;

export const paywallView = formView(paywallSchema, {
  paths: {
    list: '/articles/paywalls',
    edit: id => `/articles/paywalls/edit/${id}`,
  },
  sections: [
    { title: 'paywall.form.sections.general', fields: ['name', 'active'] },
    {
      title: 'paywall.form.sections.access',
      fields: ['anyMemberPlan', 'memberPlanIds', 'alternativeSubscribeUrl'],
    },
    {
      title: 'paywall.form.sections.texts',
      fields: ['description', 'circumventDescription'],
    },
    {
      title: 'paywall.form.upgrade',
      collapsible: 'closed',
      fields: ['upgradeDescription', 'upgradeCircumventDescription'],
    },
    {
      title: 'paywall.form.bypasses',
      description: 'paywall.form.bypassesInfo',
      fields: ['bypassTokens'],
    },
    {
      title: 'paywall.form.display',
      placement: 'aside',
      fields: ['hideContentAfter', 'fadeout'],
    },
  ],
  fields: {
    memberPlanIds: { disabled: memberPlansLocked },
    bypassTokens: { props: { addLabel: 'paywall.form.addBypass' } },
    'bypassTokens.*': { layout: BypassTokenRow },
  },
  serverErrors: [
    {
      match: uniqueConstraint('name'),
      path: 'name',
      error: 'paywall.form.nameTaken',
    },
  ],
});
