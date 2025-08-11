import {createContext, PropsWithChildren, useContext} from 'react'
import {Article as ArticleType} from '@wepublish/website/api'

interface ArticleContextValue {
  article?: ArticleType
}

export const ArticleContext = createContext<ArticleContextValue | null>(null)

export const useArticleContext = () => {
  const context = useContext(ArticleContext)
  if (!context) {
    return {article: null}
  }
  return context
}

export const ArticleProvider = ({article, children}: PropsWithChildren<{article: ArticleType}>) => {
  return <ArticleContext.Provider value={{article}}>{children}</ArticleContext.Provider>
}
