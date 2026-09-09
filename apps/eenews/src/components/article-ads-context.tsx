import { createContext, useContext } from 'react';

export const ArticleAdsSuppressedContext = createContext(false);

export const useArticleAdsSuppressed = (): boolean =>
  useContext(ArticleAdsSuppressedContext);
