export interface ArticleArguments {
  peer?: string
  id?: string
}

export interface ArticlesArguments {
  peer?: string
}

export interface Article {
  peer?: string
  id: string
  title: string
  lead: string
}

export interface Adapter {
  getArticle(args: ArticleArguments): Article | undefined
  getArticles(args: ArticlesArguments): Article[]
}

export default Adapter
