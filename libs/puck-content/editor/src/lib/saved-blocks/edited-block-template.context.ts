import { createContext, useContext } from 'react';

export const EditedBlockTemplateContext = createContext<string | null>(null);

export const useEditedBlockTemplate = () =>
  useContext(EditedBlockTemplateContext);
