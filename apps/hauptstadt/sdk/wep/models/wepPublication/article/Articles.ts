import Article from '~/sdk/wep/models/wepPublication/article/Article'
import PageInfo from '~/sdk/wep/models/wepPublication/page/PageInfo'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'

export default class Articles {
  public articles: (ReducedArticle | Article)[]
  public pageInfo: PageInfo
  public totalCount: number

  constructor(
    {
      nodes,
      pageInfo,
      totalCount
    }: {nodes: (Article | ReducedArticle)[]; pageInfo: PageInfo; totalCount: number},
    parseAsReduced: boolean = false
  ) {
    this.articles = []
    this.parseArticleNodes(nodes, parseAsReduced)
    this.pageInfo = pageInfo
    this.totalCount = totalCount
  }

  private parseArticleNodes(
    articlesToParse: (Article | ReducedArticle)[],
    parseAsReduced: boolean
  ): Articles {
    this.articles = []
    for (const article of articlesToParse) {
      if (parseAsReduced) {
        this.articles.push(new ReducedArticle(article))
      } else {
        this.articles.push(new Article(article as Article))
      }
    }
    return this
  }
}
