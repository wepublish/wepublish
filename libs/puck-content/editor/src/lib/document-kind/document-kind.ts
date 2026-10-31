import { PuckDocumentKind } from '@wepublish/puck-content/website';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export type PuckEditorDocumentKind = PuckDocumentKind;

export const PuckDocumentKindContext =
  createContext<PuckEditorDocumentKind>('page');

export const usePuckDocumentKind = () => useContext(PuckDocumentKindContext);

export const usePuckDocumentKindLabel = () => {
  const { t } = useTranslation();
  const kind = usePuckDocumentKind();
  const labels: Record<PuckEditorDocumentKind, string> = {
    page: t('', 'Page'),
    article: t('', 'Article'),
  };

  return labels[kind];
};
