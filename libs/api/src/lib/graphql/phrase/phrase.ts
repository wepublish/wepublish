import {GraphQLObjectType, GraphQLNonNull, GraphQLList} from 'graphql'
import {Context} from '../../context'
import {GraphQLPublicArticle} from '../article'
import {PublicArticle} from '../../db/article'
import {PublicPage} from '../../db/page'
import {GraphQLPublicPage} from '../page'

export const GraphQLPublicPhrase = new GraphQLObjectType<
  {
    articles: PublicArticle[]
    pages: PublicPage[]
  },
  Context
>({
  name: 'Phrase',
  fields: {
    articles: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicArticle)))},
    pages: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicPage)))}
  }
})
