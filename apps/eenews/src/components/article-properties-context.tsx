import { createContext, useContext } from 'react';

export type ArticleProperty = {
  key: string;
  value: string;
  public: boolean;
};

export const ArticlePropertiesContext = createContext<ArticleProperty[]>([]);

export const useArticleProperty = (key: string): string | undefined => {
  const properties = useContext(ArticlePropertiesContext);
  return properties.find(p => p.key === key)?.value;
};

export const useArticlePropertyFlag = (key: string): boolean =>
  useArticleProperty(key) === 'true';
