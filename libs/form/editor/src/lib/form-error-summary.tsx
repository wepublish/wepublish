import styled from '@emotion/styled';
import { Alert, AlertTitle } from '@mui/material';
import { useFormErrorSummary } from '@wepublish/form/core';
import { useTranslation } from 'react-i18next';

const Entries = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing(2.5)};
`;

const EntryButton = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
`;

export function FormErrorSummary() {
  const { t } = useTranslation();
  const entries = useFormErrorSummary();

  if (entries.length === 0) {
    return null;
  }

  return (
    <Alert severity="error">
      <AlertTitle>{t('form.errorSummary.title')}</AlertTitle>
      <Entries>
        {entries.map(entry => {
          const text = (
            <>
              {entry.label === undefined || entry.label === null ? null : (
                <>{entry.label}: </>
              )}
              {entry.message}
            </>
          );

          return (
            <li key={entry.path}>
              {entry.focus ?
                <EntryButton
                  type="button"
                  onClick={entry.focus}
                >
                  {text}
                </EntryButton>
              : text}
            </li>
          );
        })}
      </Entries>
    </Alert>
  );
}
