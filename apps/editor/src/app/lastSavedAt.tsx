import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const Text = styled.div`
  margin-top: 6px;
  text-align: center;
  font-size: 12px;
  color: #8e8e93;
`;

export function LastSavedAt({ date }: { date?: string | null }) {
  const { t } = useTranslation();

  if (!date) {
    return null;
  }

  return <Text>{t('lastSavedAt', { date: new Date(date) })}</Text>;
}
