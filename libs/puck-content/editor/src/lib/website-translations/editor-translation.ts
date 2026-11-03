import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

export const useEditorTranslation = () =>
  useTranslation(undefined, { i18n: i18next });
