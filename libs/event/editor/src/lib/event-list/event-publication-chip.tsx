import styled from '@emotion/styled';
import { EditorEventListItemFragment } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

import { formatRelativeTime } from './event-format';

export type EventPublicationMark =
  'draft' | 'reviewRequested' | 'pending' | 'published';

const MARKS: Record<EventPublicationMark, string> = {
  draft: '○',
  reviewRequested: '◐',
  pending: '◔',
  published: '●',
};

const COLOR: Record<EventPublicationMark, string> = {
  draft: 'draft',
  reviewRequested: 'pending',
  pending: 'pending',
  published: 'published',
};

export const eventPublicationMarks = (
  event: Pick<
    EditorEventListItemFragment,
    'draft' | 'pending' | 'published' | 'reviewRequestedAt'
  >
): EventPublicationMark[] => {
  const marks: EventPublicationMark[] = [];

  if (event.reviewRequestedAt) {
    marks.push('reviewRequested');
  } else if (event.draft) {
    marks.push('draft');
  }

  if (event.pending) {
    marks.push('pending');
  }

  if (event.published) {
    marks.push('published');
  }

  return marks.length ? marks : ['draft'];
};

const Chips = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Chip = styled.span<{ state: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${({ state }) => `var(--wep-state-${state})`};
  color: ${({ state }) => `var(--wep-state-${state}-text, inherit)`};
`;

export interface EventPublicationChipProps {
  event: Pick<
    EditorEventListItemFragment,
    'draft' | 'pending' | 'published' | 'reviewRequestedAt'
  >;
  now: Date;
}

export function EventPublicationChip({
  event,
  now,
}: EventPublicationChipProps) {
  const { t, i18n } = useTranslation();

  return (
    <Chips>
      {eventPublicationMarks(event).map(mark => (
        <Chip
          key={mark}
          state={COLOR[mark]}
        >
          <span aria-hidden="true">{MARKS[mark]}</span>
          <span>
            {mark === 'reviewRequested' && event.reviewRequestedAt ?
              t('agenda.publication.reviewRequestedAgo', {
                time: formatRelativeTime(
                  event.reviewRequestedAt,
                  now,
                  i18n.language
                ),
              })
            : t(`agenda.publication.${mark}`)}
          </span>
        </Chip>
      ))}
    </Chips>
  );
}
