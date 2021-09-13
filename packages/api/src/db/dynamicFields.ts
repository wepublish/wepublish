
//
export interface ArticleDynamicField {
  id: string
  field: string
  slug: string
}

export interface ArticleDynamicFieldInput {
  [field: string]: string
  slug: string
}

export interface ArticleDynamicFieldArgs {
  input: ArticleDynamicFieldInput
}


export interface ArticleInput {
  id: string
  fields: ArticleDynamicField[]
}

export interface CreateArticleArgs {
  input: ArticleInput
}


export interface DBArticleAdapter {
  createArticleDynamicField(args: ArticleDynamicFieldArgs): Promise<ArticleDynamicField>
  createArticle(args: CreateArticleArgs): Promise<any>
}
