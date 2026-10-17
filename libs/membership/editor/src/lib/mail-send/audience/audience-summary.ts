/**
 * A saved audience filter, read back as short phrases. Takes the raw JSON a
 * bulk switch recorded, which may predate fields that exist today or carry
 * ones that no longer do, so every key is optional and unknown ones are
 * ignored.
 */
export type AudienceSummaryLookups = {
  t: (key: string, options?: Record<string, unknown>) => string;
  memberPlans: Map<string, string>;
  paymentMethods: Map<string, string>;
  templates: Map<string, string>;
  formatDate: (iso: string) => string;
};

type Condition = {
  mailTemplateId?: string;
  negate?: boolean;
  states?: string[];
  channel?: string;
  from?: string;
  to?: string;
};

const yesNo = (t: AudienceSummaryLookups['t'], value: unknown) =>
  value ? t('mailSend.yes') : t('mailSend.no');

const period = (
  { t, formatDate }: AudienceSummaryLookups,
  from?: string,
  to?: string
) => {
  if (from && to) {
    return t('mailSend.audienceSummary.between', {
      from: formatDate(from),
      to: formatDate(to),
    });
  }

  if (from) {
    return t('mailSend.audienceSummary.from', { from: formatDate(from) });
  }

  if (to) {
    return t('mailSend.audienceSummary.to', { to: formatDate(to) });
  }

  return '';
};

const conditionPhrase = (
  lookups: AudienceSummaryLookups,
  condition: Condition
): string => {
  const { t, templates } = lookups;
  const name =
    templates.get(condition.mailTemplateId ?? '') ?? condition.mailTemplateId;
  const details = [
    ...(condition.states ?? []).map(state =>
      t(`mailSend.mailHistory.states.${state}`)
    ),
    ...(condition.channel ? [t(`mailSend.channel.${condition.channel}`)] : []),
  ];

  return [
    t(
      condition.negate ?
        'mailSend.audienceSummary.notReceived'
      : 'mailSend.audienceSummary.received'
    ),
    `«${name}»`,
    details.length ? `(${details.join(', ')})` : '',
    period(lookups, condition.from, condition.to),
  ]
    .filter(Boolean)
    .join(' ');
};

export function describeAudience(
  audience: Record<string, unknown>,
  lookups: AudienceSummaryLookups
): string[] {
  const { t, memberPlans, paymentMethods } = lookups;
  const phrases: string[] = [
    t(`mailSend.base.${audience['base'] ?? 'allUsers'}`),
  ];
  const labelled = (label: string, value: string) => `${label}: ${value}`;

  const planIds = audience['memberPlanIDs'] as string[] | undefined;
  if (planIds?.length) {
    phrases.push(
      labelled(
        t('mailSend.audienceSummary.memberPlans'),
        planIds.map(id => memberPlans.get(id) ?? id).join(', ')
      )
    );
  }

  if (audience['subscriptionState']) {
    phrases.push(
      labelled(
        t('mailSend.audienceSummary.state'),
        t(`mailSend.state.${audience['subscriptionState']}`)
      )
    );
  }

  if (audience['paymentMethodID']) {
    const id = audience['paymentMethodID'] as string;
    phrases.push(
      labelled(t('mailSend.paymentMethod'), paymentMethods.get(id) ?? id)
    );
  }

  if (audience['paymentPeriodicity']) {
    phrases.push(
      labelled(
        t('mailSend.periodicity'),
        t(`memberPlanList.paymentPeriodicity.${audience['paymentPeriodicity']}`)
      )
    );
  }

  for (const [key, label] of [
    ['autoRenew', 'mailSend.autoRenew'],
    ['isPaid', 'mailSend.isPaid'],
    ['isCanceled', 'mailSend.isCanceled'],
    ['hasReplacedSubscription', 'mailSend.hasReplacedSubscription'],
  ] as const) {
    if (typeof audience[key] === 'boolean') {
      phrases.push(labelled(t(label), yesNo(t, audience[key])));
    }
  }

  const starts = period(
    lookups,
    audience['startsAtFrom'] as string,
    audience['startsAtTo'] as string
  );
  if (starts) {
    phrases.push(labelled(t('mailSend.startsAt'), starts));
  }

  const ends = period(
    lookups,
    audience['endsAtFrom'] as string,
    audience['endsAtTo'] as string
  );
  if (ends) {
    phrases.push(labelled(t('mailSend.endsAt'), ends));
  }

  if (audience['endedWithinDays']) {
    phrases.push(
      labelled(
        t('mailSend.endedWindow.label'),
        `${audience['endedWithinDays']} ${t('mailSend.endedWindow.days')}`
      )
    );
  }

  const ended = period(
    lookups,
    audience['endedFrom'] as string,
    audience['endedTo'] as string
  );
  if (ended) {
    phrases.push(labelled(t('mailSend.endedWindow.label'), ended));
  }

  const segments = audience['emailSegments'] as string[] | undefined;
  if (segments?.length) {
    phrases.push(
      labelled(
        t('mailSend.audienceSummary.segments'),
        segments
          .map(segment => t(`mailSend.emailSegments.${segment}`))
          .join(', ')
      )
    );
  }

  const history = audience['mailHistory'] as
    | { match?: string; conditions?: Condition[] }
    | undefined;
  const conditions = history?.conditions ?? [];

  for (const condition of conditions) {
    phrases.push(
      labelled(
        t('mailSend.audienceSummary.mailHistory'),
        conditionPhrase(lookups, condition)
      )
    );
  }

  if (conditions.length > 1) {
    phrases.push(
      t(
        history?.match === 'any' ?
          'mailSend.audienceSummary.matchAny'
        : 'mailSend.audienceSummary.matchAll'
      )
    );
  }

  return phrases;
}
