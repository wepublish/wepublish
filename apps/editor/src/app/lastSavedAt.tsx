import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const Text = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export function LastSavedAt({ date }: { date?: string | null }) {
  const { t } = useTranslation();

  if (!date) {
    return null;
  }

  return <Text>{t('lastSavedAt', { date: new Date(date) })}</Text>;
}
