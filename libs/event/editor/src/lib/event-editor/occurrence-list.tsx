import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { FormLabel, TablePagination, Typography } from '@mui/material';
import { EditorEventOccurrencesDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  formatEventDateTime,
  formatEventTime,
} from '../event-list/event-format';

export const OCCURRENCE_PAGE_SIZE = 20;

const Wrapper = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Dates = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing(0.5, 2)};
  font-variant-numeric: tabular-nums;
`;

export function OccurrenceList({ eventId }: { eventId: string }) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);

  const { data, loading } = useQuery(EditorEventOccurrencesDocument, {
    variables: {
      id: eventId,
      take: OCCURRENCE_PAGE_SIZE,
      skip: page * OCCURRENCE_PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
  });

  const occurrences = data?.agenda.nodes ?? [];
  const totalCount = data?.agenda.totalCount ?? 0;

  return (
    <Wrapper aria-busy={loading}>
      <FormLabel component="h3">
        {t('agenda.editor.occurrences.title', { count: totalCount })}
      </FormLabel>

      {!loading && totalCount === 0 ?
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t('agenda.editor.occurrences.none')}
        </Typography>
      : <Dates>
          {occurrences.map(occurrence => (
            <li key={occurrence.id}>
              {formatEventDateTime(occurrence.dateFrom, i18n.language)}–
              {formatEventTime(occurrence.dateTo, i18n.language)}
            </li>
          ))}
        </Dates>
      }

      {totalCount > OCCURRENCE_PAGE_SIZE && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          rowsPerPage={OCCURRENCE_PAGE_SIZE}
          rowsPerPageOptions={[]}
          onPageChange={(_event, next) => setPage(next)}
        />
      )}
    </Wrapper>
  );
}
