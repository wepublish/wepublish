import { useQuery } from '@apollo/client/react';
import {
  MailTemplateDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
} from '@wepublish/editor/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { AudienceSummaryLookups } from '../mail-send/audience/audience-summary';

/**
 * What `describeAudience` needs to turn a saved filter into phrases: the
 * names behind the ids it stores. Shared by the wizard's review step and the
 * history, so a switch reads the same before and after it happened.
 */
export function useAudienceLookups(): AudienceSummaryLookups {
  const { t, i18n } = useTranslation();
  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);
  const { data: templateData } = useQuery(MailTemplateDocument);

  return useMemo(() => {
    const names = (rows: { id: string; name: string }[] | undefined) =>
      new Map((rows ?? []).map(row => [row.id, row.name]));
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString(i18n?.language ?? 'de-CH');

    return {
      t,
      memberPlans: names(memberPlanData?.memberPlans.nodes),
      paymentMethods: names(paymentMethodData?.paymentMethods),
      templates: names(templateData?.mailTemplates),
      formatDate,
    };
  }, [t, i18n, memberPlanData, paymentMethodData, templateData]);
}
