import {Adapter, Article, ArticleArguments, ArticlesArguments} from '@wepublish/api'

export interface MockAdapterOptions {
  articles?: Article[]
}

export class MockAdapter implements Adapter {
  private _articles: Article[]

  constructor(opts: MockAdapterOptions = {}) {
    this._articles = opts.articles || []
  }

  getArticle(args: ArticleArguments): Article | undefined {
    return this._articles.find(article => article.id === args.id)
  }

  getArticles(args: ArticlesArguments): Article[] {
    return this._articles.filter(article => args.peer === undefined || article.peer == args.peer)
  }
}

export default MockAdapter
