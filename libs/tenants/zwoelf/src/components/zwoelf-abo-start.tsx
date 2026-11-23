import styled from '@emotion/styled';
import { TextField } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useZwoelfSubscribeStep,
  ZwoelfFirstIssueChoice,
  ZwoelfPrintIssueStart,
} from './zwoelf-subscribe-step-context';

const Section = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  align-content: start;
`;

/** «2026-12-11» → «11.12.2026» */
const formatDay = (ymd: string) => ymd.split('-').reverse().join('.');

/** What an option says: «Aktuelle Ausgabe #117 · Fankurve». */
const optionLabels = (
  start: ZwoelfPrintIssueStart,
  t: ReturnType<typeof useTranslation>['t']
) => ({
  current: [
    t('zwoelf.subscribe.aboStart.current', { label: start.current.label }),
    start.current.title,
  ]
    .filter(Boolean)
    .join(' · '),
  upcoming:
    start.upcoming ?
      [
        t('zwoelf.subscribe.aboStart.upcoming', {
          label: start.upcoming.label,
        }),
        start.upcoming.title ||
          t('zwoelf.subscribe.aboStart.ships', {
            day: formatDay(start.upcoming.issueDate),
          }),
      ].join(' · ')
    : t('zwoelf.subscribe.aboStart.upcomingUnknown'),
});

/** The issue's label as the summary names it: «#117», or none for an unknown next one. */
export const chosenIssueLabel = (
  start: ZwoelfPrintIssueStart | null,
  choice: ZwoelfFirstIssueChoice
) =>
  choice === 'current' ? start?.current.label
  : choice === 'upcoming' ? start?.upcoming?.label
  : undefined;

/**
 * «Abo-Start»: which printed issue the subscription starts with. Required
 * while the chosen plan and duration print issues; starts on the neutral
 * «Ausgabe wählen».
 */
export const ZwoelfAboStart = () => {
  const { t } = useTranslation();
  const {
    elements: { H5 },
  } = useWebsiteBuilder();
  const id = useId();
  const {
    printStart,
    firstIssue,
    setFirstIssue,
    firstIssueMissing,
    setFirstIssueMissing,
  } = useZwoelfSubscribeStep();

  if (!printStart) {
    return null;
  }

  const labels = optionLabels(printStart, t);

  return (
    <Section data-area="aboStart">
      <H5
        component="h2"
        id={`${id}-title`}
      >
        {t('zwoelf.subscribe.aboStart.title')}
      </H5>

      <TextField
        select
        value={firstIssue}
        onChange={event => {
          setFirstIssue(event.target.value as ZwoelfFirstIssueChoice);
          setFirstIssueMissing(false);
        }}
        error={firstIssueMissing}
        helperText={
          firstIssueMissing ? t('zwoelf.subscribe.aboStart.required') : ''
        }
        slotProps={{
          select: { native: true },
          htmlInput: { 'aria-labelledby': `${id}-title` },
        }}
        fullWidth
      >
        <option value="">{t('zwoelf.subscribe.aboStart.choose')}</option>
        <option value="current">{labels.current}</option>
        <option value="upcoming">{labels.upcoming}</option>
      </TextField>
    </Section>
  );
};
