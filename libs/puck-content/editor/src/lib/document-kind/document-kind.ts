import { PuckDocumentKind } from '@wepublish/puck-content/website';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export type PuckEditorDocumentKind = PuckDocumentKind;

export const PuckDocumentKindContext =
  createContext<PuckEditorDocumentKind>('page');

export const usePuckDocumentKind = () => useContext(PuckDocumentKindContext);

export const PuckBlockTemplateDocumentContext = createContext(false);

export const usePuckDocumentKindLabel = () => {
  const { t } = useTranslation();
  const kind = usePuckDocumentKind();
  const blockTemplate = useContext(PuckBlockTemplateDocumentContext);

  if (blockTemplate) {
    return t('puck.documentKind.blockTemplate');
  }

  const labels: Record<PuckEditorDocumentKind, string> = {
    page: t('puck.documentKind.page'),
    article: t('puck.documentKind.article'),
  };

  return labels[kind];
};
