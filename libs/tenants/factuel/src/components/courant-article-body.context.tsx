import { createContext, useContext } from 'react';

export const ArticleBodyContext = createContext(false);

export const useIsArticleBody = () => useContext(ArticleBodyContext);
