import {Injectable} from '@nestjs/common'
import {Article} from '@prisma/client'
import {URLAdapter} from './url-adapter'

@Injectable()
export class HauptstadtURLAdapter extends URLAdapter {
  override async getArticleUrl(article: Article) {
    console.log(`${this.baseURL}/a/${article.slug}?articleId=${article.id}`)
    return `${this.baseURL}/a/${article.slug}?articleId=${article.id}`
  }

  override async getArticlePreviewUrl(article: Article) {
    return `${await this.getArticleUrl(article)}&preview`
  }
}
